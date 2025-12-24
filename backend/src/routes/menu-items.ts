import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  menuItemFilterSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../utils/validation.js";
import {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../services/menu-items.js";

export const menuItemsRouter = express.Router();

menuItemsRouter.use(authenticate);

// GET /api/admin/menu/items - List items with filtering, sorting, pagination
menuItemsRouter.get("/", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const validated = menuItemFilterSchema.parse(req.query);

    const result = await getMenuItems(restaurantId, validated);
    res.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Invalid query parameters", details: error.errors });
    }
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/menu/items/:id - Get single item
menuItemsRouter.get("/:id", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const item = await getMenuItemById(req.params.id, restaurantId);

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/menu/items - Create item
menuItemsRouter.post("/", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const validated = createMenuItemSchema.parse(req.body);

    const item = await createMenuItem(restaurantId, validated);
    res.status(201).json(item);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/menu/items/:id - Update item
menuItemsRouter.put("/:id", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const validated = updateMenuItemSchema.parse(req.body);

    const item = await updateMenuItem(req.params.id, restaurantId, validated);

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(item);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/menu/items/:id - Soft delete item
menuItemsRouter.delete("/:id", async (req, res) => {
  try {
    const restaurantId = (req as any).restaurantId;
    const success = await deleteMenuItem(req.params.id, restaurantId);

    if (!success) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
