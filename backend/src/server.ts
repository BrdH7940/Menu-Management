import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { categoriesRouter } from './routes/categories.js';
import { menuItemsDbRouter } from './routes/menu-items-db.js';
import { photosDbRouter } from './routes/photos-db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Routes - Database routes
app.use('/api/admin/menu/categories', categoriesRouter);
app.use('/api/admin/menu/items', menuItemsDbRouter);
app.use('/api/admin/menu/items', photosDbRouter); // Photos routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Menu Management API đang hoạt động'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server không xác định',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📋 API Categories: http://localhost:${PORT}/api/admin/menu/categories`);
  console.log(`🍽️  API Menu Items: http://localhost:${PORT}/api/admin/menu/items`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
});
