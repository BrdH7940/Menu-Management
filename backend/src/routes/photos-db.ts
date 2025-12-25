import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { authenticate } from "../middleware/auth.js";
import { validateImageFile } from "../middleware/upload-validation.js";
import { photoService } from "../services/photos-supabase.js";

export const photosDbRouter = express.Router();

photosDbRouter.use(authenticate);

// Setup upload directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads")
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `temp-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB default
  },
  fileFilter: validateImageFile, // Sử dụng middleware validation đã có để đảm bảo bảo mật tốt hơn
});

// GET /api/admin/menu/items/:id/photos - Lấy danh sách ảnh
photosDbRouter.get("/:id/photos", async (req, res) => {
  try {
    const menuItemId = req.params.id;
    const photos = await photoService.getPhotos(menuItemId);

    res.json({
      success: true,
      data: photos.map((p) => ({
        id: p.id,
        url: p.url,
        isPrimary: p.is_primary,
        displayOrder: p.display_order,
        createdAt: p.created_at,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching photos:", error);
    res
      .status(500)
      .json({ success: false, message: "Không thể lấy danh sách ảnh" });
  }
});

// POST /api/admin/menu/items/:id/photos - Upload ảnh
photosDbRouter.post(
  "/:id/photos",
  upload.array("photos", 10),
  async (req, res) => {
    try {
      const menuItemId = req.params.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Không có file nào được upload" });
      }

      const photos = await photoService.uploadPhotos(menuItemId, files);

      res.status(201).json({
        success: true,
        data: photos.map((p) => ({
          id: p.id,
          url: p.url,
          isPrimary: p.is_primary,
          displayOrder: p.display_order,
          createdAt: p.created_at,
        })),
      });
    } catch (error: any) {
      console.error("Error uploading photos:", error);

      if (error.message?.includes("MENU_ITEM_NOT_FOUND")) {
        return res
          .status(404)
          .json({ success: false, message: "Món ăn không tồn tại" });
      }

      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Không thể upload ảnh",
        });
    }
  }
);

// DELETE /api/admin/menu/items/:id/photos/:photoId - Xóa ảnh
photosDbRouter.delete("/:id/photos/:photoId", async (req, res) => {
  try {
    const { id: menuItemId, photoId } = req.params;

    await photoService.deletePhoto(photoId, menuItemId);

    res.json({ success: true, message: "Đã xóa ảnh thành công" });
  } catch (error: any) {
    console.error("Error deleting photo:", error);

    if (error.message?.includes("PHOTO_NOT_FOUND")) {
      return res
        .status(404)
        .json({ success: false, message: "Ảnh không tồn tại" });
    }

    res.status(500).json({ success: false, message: "Không thể xóa ảnh" });
  }
});

// PATCH /api/admin/menu/items/:id/photos/:photoId/primary - Đặt ảnh làm primary
photosDbRouter.patch("/:id/photos/:photoId/primary", async (req, res) => {
  try {
    const { id: menuItemId, photoId } = req.params;

    await photoService.setPrimaryPhoto(photoId, menuItemId);

    res.json({ success: true, message: "Đã đặt ảnh làm ảnh chính" });
  } catch (error: any) {
    console.error("Error setting primary photo:", error);

    if (error.message?.includes("PHOTO_NOT_FOUND")) {
      return res
        .status(404)
        .json({ success: false, message: "Ảnh không tồn tại" });
    }

    res
      .status(500)
      .json({ success: false, message: "Không thể đặt ảnh làm ảnh chính" });
  }
});
