import { supabase } from '../db/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
);
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export interface MenuItemPhoto {
  id: string;
  menu_item_id: string;
  url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export class PhotoService {
  /**
   * Upload photos cho một menu item
   */
  async uploadPhotos(
    menuItemId: string,
    files: Express.Multer.File[]
  ): Promise<MenuItemPhoto[]> {
    // Verify menu item exists
    const { data: item, error: itemError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('id', menuItemId)
      .eq('is_deleted', false)
      .single();

    if (itemError || !item) {
      // Clean up uploaded files
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      throw new Error('MENU_ITEM_NOT_FOUND: Món ăn không tồn tại');
    }

    // Check if there's existing primary photo
    const { data: existingPhotos } = await supabase
      .from('menu_item_photos')
      .select('id, is_primary')
      .eq('menu_item_id', menuItemId);

    const hasPrimary = existingPhotos?.some(p => p.is_primary) || false;
    const currentCount = existingPhotos?.length || 0;

    const createdPhotos: MenuItemPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const newFilename = `photo-${menuItemId}-${uniqueSuffix}${ext}`;
        const newPath = path.join(uploadDir, newFilename);

        // Move file to uploads directory (or it's already there from multer)
        if (file.path !== newPath) {
          fs.renameSync(file.path, newPath);
        }

        // Generate URL
        const url = `${baseUrl}/uploads/${newFilename}`;

        // First photo becomes primary if no existing primary
        const isPrimary = !hasPrimary && createdPhotos.length === 0;

        // Insert into database
        const { data: photo, error } = await supabase
          .from('menu_item_photos')
          .insert({
            menu_item_id: menuItemId,
            url: url,
            is_primary: isPrimary,
            display_order: currentCount + i,
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting photo:', error);
          // Clean up file on error
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
          throw new Error('Không thể lưu ảnh vào database');
        }

        createdPhotos.push(photo);
      } catch (error) {
        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw error;
      }
    }

    return createdPhotos;
  }

  /**
   * Lấy danh sách ảnh của một menu item
   */
  async getPhotos(menuItemId: string): Promise<MenuItemPhoto[]> {
    const { data: photos, error } = await supabase
      .from('menu_item_photos')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching photos:', error);
      return [];
    }

    return photos || [];
  }

  /**
   * Xóa một ảnh
   */
  async deletePhoto(photoId: string, menuItemId: string): Promise<void> {
    // Get photo info first
    const { data: photo, error: fetchError } = await supabase
      .from('menu_item_photos')
      .select('*')
      .eq('id', photoId)
      .eq('menu_item_id', menuItemId)
      .single();

    if (fetchError || !photo) {
      throw new Error('PHOTO_NOT_FOUND: Ảnh không tồn tại');
    }

    // Delete from database
    const { error } = await supabase
      .from('menu_item_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Không thể xóa ảnh');
    }

    // Delete file from disk
    try {
      const filename = photo.url.split('/uploads/').pop();
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (e) {
      console.warn('Could not delete file from disk:', e);
    }

    // If deleted photo was primary, set next photo as primary
    if (photo.is_primary) {
      const { data: nextPhoto } = await supabase
        .from('menu_item_photos')
        .select('id')
        .eq('menu_item_id', menuItemId)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (nextPhoto) {
        await supabase
          .from('menu_item_photos')
          .update({ is_primary: true })
          .eq('id', nextPhoto.id);
      }
    }
  }

  /**
   * Đặt ảnh làm primary
   */
  async setPrimaryPhoto(photoId: string, menuItemId: string): Promise<void> {
    // Check photo exists
    const { data: photo, error: fetchError } = await supabase
      .from('menu_item_photos')
      .select('id')
      .eq('id', photoId)
      .eq('menu_item_id', menuItemId)
      .single();

    if (fetchError || !photo) {
      throw new Error('PHOTO_NOT_FOUND: Ảnh không tồn tại');
    }

    // Remove primary from all other photos
    await supabase
      .from('menu_item_photos')
      .update({ is_primary: false })
      .eq('menu_item_id', menuItemId);

    // Set this photo as primary
    const { error } = await supabase
      .from('menu_item_photos')
      .update({ is_primary: true })
      .eq('id', photoId);

    if (error) {
      console.error('Error setting primary photo:', error);
      throw new Error('Không thể đặt ảnh làm ảnh chính');
    }
  }

  /**
   * Lấy URL ảnh primary của một menu item
   */
  async getPrimaryPhotoUrl(menuItemId: string): Promise<string | null> {
    const { data: photo } = await supabase
      .from('menu_item_photos')
      .select('url')
      .eq('menu_item_id', menuItemId)
      .eq('is_primary', true)
      .single();

    return photo?.url || null;
  }
}

export const photoService = new PhotoService();
