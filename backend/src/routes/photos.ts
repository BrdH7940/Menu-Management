import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import {
  uploadPhotos,
  deletePhoto,
  setPrimaryPhoto,
} from "../services/photos.js";
import { validateImageFile } from "../middleware/upload-validation.js";

export const photosRouter = express.Router();

photosRouter.use(authenticate);

// Configure multer for file uploads
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads")
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate random filename to prevent conflicts
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB default
  },
  fileFilter: validateImageFile,
});

// POST /api/admin/menu/items/:id/photos - Upload multiple photos
photosRouter.post(
  "/:id/photos",
  upload.array("photos", 10),
  async (req, res) => {
    try {
      const restaurantId = (req as any).restaurantId;
      const menuItemId = req.params.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const photos = await uploadPhotos(menuItemId, restaurantId, files);
      res.status(201).json({ photos });
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      if (error.message === "Menu item not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/menu/items/:id/photos/:photoId - Delete photo
photosRouter.delete("/:id/photos/:photoId", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const { id: menuItemId, photoId } = req.params;

    await deletePhoto(photoId, menuItemId, restaurantId);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting photo:", error);
    if (error.message === "Photo not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/menu/items/:id/photos/:photoId/primary - Set primary photo
photosRouter.patch("/:id/photos/:photoId/primary", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const { id: menuItemId, photoId } = req.params;

    await setPrimaryPhoto(photoId, menuItemId, restaurantId);
    res.json({ message: "Primary photo updated" });
  } catch (error: any) {
    console.error("Error setting primary photo:", error);
    if (error.message === "Photo not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});
