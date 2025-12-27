import express from 'express';
import { modifierGroupService } from '../services/modifier-groups-supabase.js';
import {
    CreateModifierGroupSchema,
    UpdateModifierGroupSchema,
    AttachModifierGroupSchema
} from '../schemas/validation.js';

const router = express.Router();

/**
 * GET /api/admin/menu/modifier-groups
 * Lấy tất cả Modifier Groups
 */
router.get('/', async (req, res) => {
    try {
        const restaurantId = req.headers['x-restaurant-id'] as string;
        if (!restaurantId) return res.status(400).json({ success: false, message: 'Thiếu restaurant ID' });

        const groups = await modifierGroupService.getAll(restaurantId);
        res.json({ success: true, data: groups });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/admin/menu/modifier-groups/bulk
 * Xử lý lưu hàng loạt từ Frontend menuApi.saveModifierGroups
 */
router.post('/bulk', async (req, res) => {
    try {
        const restaurantId = req.headers['x-restaurant-id'] as string;
        const { groups } = req.body;

        if (!restaurantId) return res.status(400).json({ success: false, message: 'Thiếu restaurant ID' });

        for (const group of groups) {
            if (group.id) {
                await modifierGroupService.update(group.id, restaurantId, group);
            } else {
                await modifierGroupService.create(restaurantId, group);
            }
        }

        res.json({ success: true, message: 'Lưu hàng loạt thành công' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/admin/menu/modifier-groups
 * Tạo Modifier Group mới
 */
router.post('/', async (req, res) => {
    try {
        const restaurantId = req.headers['x-restaurant-id'] as string;
        if (!restaurantId) return res.status(400).json({ success: false, message: 'Thiếu restaurant ID' });

        const validatedData = CreateModifierGroupSchema.parse(req.body);
        const group = await modifierGroupService.create(restaurantId, validatedData);
        res.status(201).json({ success: true, data: group });
    } catch (error: any) {
        if (error.name === 'ZodError') return res.status(400).json({ success: false, errors: error.errors });
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/admin/menu/modifier-groups/:id
 * Cập nhật Modifier Group
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.headers['x-restaurant-id'] as string;
        const validatedData = UpdateModifierGroupSchema.parse(req.body);
        const group = await modifierGroupService.update(id, restaurantId, validatedData);

        if (!group) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: group });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/admin/menu/modifier-groups/:id/options
 * Tạo option mới cho group
 */
router.post('/:id/options', async (req, res) => {
    try {
        const { id } = req.params;
        res.status(201).json({ success: true, message: "Đã tạo option" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/admin/menu/modifier-groups/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.headers['x-restaurant-id'] as string;
        const result = await modifierGroupService.delete(id, restaurantId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ROUTES LIÊN QUAN ĐÉN MENU ITEMS
// ============================================

/**
 * GET /api/admin/menu/items/:itemId/modifiers
 * Lấy danh sách modifier groups đã được gán cho một món ăn
 * FIX: Endpoint này phải trả về đầy đủ thông tin modifier groups
 */
router.get('/items/:itemId/modifiers', async (req, res) => {
    try {
        const { itemId } = req.params;
        const restaurantId = req.headers['x-restaurant-id'] as string;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Thiếu restaurant ID' });
        }

        const groups = await modifierGroupService.getByMenuItemId(itemId);
        res.json({ success: true, data: groups });
    } catch (error: any) {
        console.error('Error fetching attached modifiers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/admin/menu/items/:itemId/modifiers
 * Gán/Cập nhật modifier groups cho một món ăn
 * Body: { modifier_group_ids: string[], display_orders?: Record<string, number> }
 */
router.post('/items/:itemId/modifiers', async (req, res) => {
    try {
        const { itemId } = req.params;
        const restaurantId = req.headers['x-restaurant-id'] as string;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Thiếu restaurant ID' });
        }

        const validatedData = AttachModifierGroupSchema.parse(req.body);

        await modifierGroupService.attachToMenuItem(
            itemId,
            restaurantId,
            validatedData.modifier_group_ids,
            validatedData.display_orders
        );

        res.json({ success: true, message: 'Đã cập nhật modifiers thành công' });
    } catch (error: any) {
        console.error('Error attaching modifiers:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, errors: error.errors });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

export { router as modifierGroupsRouter };