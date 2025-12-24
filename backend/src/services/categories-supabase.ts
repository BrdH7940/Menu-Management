import { supabase } from '../db/supabase.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/validation.js';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  status: 'active' | 'inactive';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export class CategoryService {
  /**
   * Tạo danh mục mới
   */
  async create(data: CreateCategoryInput): Promise<Category> {
    // Kiểm tra tên trùng lặp
    const { data: existing } = await supabase
      .from('menu_categories')
      .select('id')
      .ilike('name', data.name)
      .eq('is_deleted', false)
      .single();
    
    if (existing) {
      throw new Error('DUPLICATE_NAME: Tên danh mục đã tồn tại');
    }

    const { data: category, error } = await supabase
      .from('menu_categories')
      .insert({
        name: data.name,
        description: data.description || null,
        display_order: data.display_order ?? 0,
        status: data.status ?? 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw new Error('Không thể tạo danh mục: ' + error.message);
    }

    return category;
  }

  /**
   * Lấy tất cả danh mục (không bao gồm đã xóa)
   */
  async getAll(sortBy: string = 'display_order', sortOrder: string = 'asc'): Promise<Category[]> {
    const validSortFields = ['display_order', 'name', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'display_order';
    const ascending = sortOrder !== 'desc';

    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_deleted', false)
      .order(sortField, { ascending });

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Không thể lấy danh sách danh mục');
    }

    // Đếm số món ăn trong mỗi danh mục
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const { count } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('is_deleted', false);
        
        return {
          ...cat,
          item_count: count || 0
        };
      })
    );

    return categoriesWithCount;
  }

  /**
   * Lấy danh mục theo ID
   */
  async getById(id: string): Promise<Category | null> {
    const { data: category, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error || !category) {
      return null;
    }

    // Đếm số món ăn
    const { count } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_deleted', false);

    return {
      ...category,
      item_count: count || 0
    };
  }

  /**
   * Cập nhật danh mục
   */
  async update(id: string, data: UpdateCategoryInput): Promise<Category | null> {
    // Kiểm tra danh mục tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    // Nếu cập nhật tên, kiểm tra trùng lặp
    if (data.name) {
      const { data: duplicate } = await supabase
        .from('menu_categories')
        .select('id')
        .ilike('name', data.name)
        .neq('id', id)
        .eq('is_deleted', false)
        .single();
      
      if (duplicate) {
        throw new Error('DUPLICATE_NAME: Tên danh mục đã tồn tại');
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: category, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', id)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw new Error('Không thể cập nhật danh mục');
    }

    return category;
  }

  /**
   * Soft delete danh mục
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // Kiểm tra danh mục tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return { success: false, message: 'Danh mục không tồn tại' };
    }

    // Kiểm tra còn món ăn active trong danh mục không
    const { count } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_deleted', false);

    if (count && count > 0) {
      return { 
        success: false, 
        message: 'Không thể xóa danh mục vì còn chứa món ăn. Vui lòng xóa hoặc chuyển món ăn sang danh mục khác trước.' 
      };
    }

    // Soft delete
    const { error } = await supabase
      .from('menu_categories')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return { success: false, message: 'Không thể xóa danh mục' };
    }

    return { success: true, message: 'Đã xóa danh mục thành công' };
  }
}

export const categoryService = new CategoryService();
