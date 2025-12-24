import express from "express";
import { authenticate } from "../middleware/auth.js";
import { categories, menuItems } from "../mock/data.js";

export const menuCategoriesRouter = express.Router();

menuCategoriesRouter.use(authenticate);

// GET /api/admin/menu/categories - List categories (mock data)
menuCategoriesRouter.get("/", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId as string;

    const result = categories
      .filter((c) => c.restaurantId === restaurantId)
      .map((c) => ({
        id: c.id,
        restaurant_id: c.restaurantId,
        name: c.name,
        description: c.description,
        display_order: c.displayOrder,
        status: c.status,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
        item_count: menuItems.filter(
          (mi) => mi.categoryId === c.id && !mi.isDeleted
        ).length,
      }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching categories (mock):", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
