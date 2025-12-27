import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { menuItemsRouter } from './routes/menu-items.js';
import { menuCategoriesRouter } from './routes/menu-categories.js';
import { photosRouter } from './routes/photos.js';
import { modifierGroupsRouter } from './routes/modifier-groups.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Routes
app.use('/api/admin/menu/items', menuItemsRouter);
app.use('/api/admin/menu/categories', menuCategoriesRouter);
app.use('/api/admin/menu/items', photosRouter);
app.use('/api/admin/menu/modifier-groups', modifierGroupsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

