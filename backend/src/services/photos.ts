import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { menuItems, photos, createMockPhotoId } from "../mock/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path for upload directory
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads")
);
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function uploadPhotos(
  menuItemId: string,
  restaurantId: string,
  files: Express.Multer.File[]
) {
  // Verify menu item exists and belongs to restaurant
  const item = menuItems.find(
    (mi) => mi.id === menuItemId && mi.restaurantId === restaurantId && !mi.isDeleted
  );

  if (!item) {
    // Clean up uploaded files if item doesn't exist
    files.forEach((file) => {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    throw new Error("Menu item not found");
  }

  const existingPrimary = photos.some(
    (p) => p.menuItemId === menuItemId && p.isPrimary
  );

  const createdPhotos: {
    id: string;
    url: string;
    isPrimary: boolean;
    createdAt: string;
  }[] = [];

  for (const file of files) {
    try {
      // Process image with sharp (resize and optimize)
      const processedFilename = `processed-${file.filename}`;
      const processedPath = path.join(uploadDir, processedFilename);

      await sharp(file.path)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(processedPath);

      // Remove original file
      fs.unlinkSync(file.path);

      // Generate URL
      const url = `${baseUrl}/uploads/${processedFilename}`;

      // Determine if this should be primary (first photo if no primary exists)
      const isPrimary = !existingPrimary && createdPhotos.length === 0;

      const createdAt = new Date().toISOString();
      const id = createMockPhotoId();

      photos.push({
        id,
        menuItemId,
        url,
        isPrimary,
        createdAt,
      });

      createdPhotos.push({
        id,
        url,
        isPrimary,
        createdAt,
      });
    } catch (error) {
      // Clean up file on error
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  return createdPhotos;
}

export async function deletePhoto(
  photoId: string,
  menuItemId: string,
  restaurantId: string
) {
  const item = menuItems.find(
    (mi) => mi.id === menuItemId && mi.restaurantId === restaurantId && !mi.isDeleted
  );
  if (!item) {
    throw new Error("Photo not found");
  }

  const idx = photos.findIndex(
    (p) => p.id === photoId && p.menuItemId === menuItemId
  );
  if (idx === -1) {
    throw new Error("Photo not found");
  }

  const photo = photos[idx];

  // Delete file from filesystem
  const url = photo.url;
  const filename = url.split("/").pop();
  if (filename) {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  photos.splice(idx, 1);

  // If this was the primary photo, set another one as primary
  if (photo.isPrimary) {
    const candidate = photos.find((p) => p.menuItemId === menuItemId);
    if (candidate) {
      candidate.isPrimary = true;
    }
  }
}

export async function setPrimaryPhoto(
  photoId: string,
  menuItemId: string,
  restaurantId: string
) {
  const item = menuItems.find(
    (mi) => mi.id === menuItemId && mi.restaurantId === restaurantId && !mi.isDeleted
  );
  if (!item) {
    throw new Error("Photo not found");
  }

  const target = photos.find(
    (p) => p.id === photoId && p.menuItemId === menuItemId
  );
  if (!target) {
    throw new Error("Photo not found");
  }

  // Remove primary from all photos of this item
  photos.forEach((p) => {
    if (p.menuItemId === menuItemId) {
      p.isPrimary = false;
    }
  });

  // Set this photo as primary
  target.isPrimary = true;
}

