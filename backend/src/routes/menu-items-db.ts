import { Router, Request, Response } from 'express';
import { menuItemService, formatPrice } from '../services/menu-items-supabase.js';
import { createMenuItemSchema, updateMenuItemSchema, menuItemQuerySchema } from '../schemas/validation.js';
import { ZodError } from 'zod';
import { modifierGroupService } from '../services/modifier-groups-supabase.js'; 

const router = Router();

// Helper function để xử lý lỗi Zod
function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}

/**
 * GET /api/admin/menu/items
 * Lấy danh sách món ăn với filter, sort, pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query params
    const queryParams = menuItemQuerySchema.parse(req.query);
    
    const result = await menuItemService.getAll(queryParams);
    
    // Format giá tiền sang VND
    const formattedData = result.data.map(item => ({
      ...item,
      price_formatted: formatPrice(item.price)
    }));
    
    res.json({
      success: true,
      data: formattedData,
      pagination: result.pagination,
      message: 'Lấy danh sách món ăn thành công'
    });
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Query params không hợp lệ',
        errors: formatZodError(error)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách món ăn',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/menu/items/:id
 * Lấy chi tiết món ăn
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const item = await menuItemService.getById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Món ăn không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...item,
        price_formatted: formatPrice(item.price)
      }
    });
  } catch (error: any) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết món ăn',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/menu/items
 * Tạo món ăn mới
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createMenuItemSchema.parse(req.body);
    
    const item = await menuItemService.create(validatedData);
    
    res.status(201).json({
      success: true,
      data: {
        ...item,
        price_formatted: formatPrice(item.price)
      },
      message: 'Tạo món ăn thành công'
    });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: formatZodError(error)
      });
    }
    
    if (error.message.startsWith('DUPLICATE_NAME')) {
      return res.status(400).json({
        success: false,
        message: error.message.split(': ')[1]
      });
    }
    
    if (error.message.startsWith('CATEGORY_NOT_FOUND')) {
      return res.status(400).json({
        success: false,
        message: error.message.split(': ')[1]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo món ăn',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/menu/items/:id
 * Cập nhật món ăn
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate input
    const validatedData = updateMenuItemSchema.parse(req.body);
    
    const item = await menuItemService.update(id, validatedData);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Món ăn không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...item,
        price_formatted: formatPrice(item.price)
      },
      message: 'Cập nhật món ăn thành công'
    });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: formatZodError(error)
      });
    }
    
    if (error.message.startsWith('DUPLICATE_NAME')) {
      return res.status(400).json({
        success: false,
        message: error.message.split(': ')[1]
      });
    }
    
    if (error.message.startsWith('CATEGORY_NOT_FOUND')) {
      return res.status(400).json({
        success: false,
        message: error.message.split(': ')[1]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật món ăn',
      error: error.message
    });
  }
});

/**
 * PATCH /api/admin/menu/items/:id/status
 * Cập nhật trạng thái món ăn nhanh
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['available', 'unavailable', 'sold_out'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: available, unavailable, sold_out'
      });
    }
    
    const item = await menuItemService.updateStatus(id, status);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Món ăn không tồn tại'
      });
    }
    
    const statusMessages: Record<string, string> = {
      available: 'Còn hàng',
      unavailable: 'Không có sẵn',
      sold_out: 'Hết hàng'
    };
    
    res.json({
      success: true,
      data: {
        ...item,
        price_formatted: formatPrice(item.price)
      },
      message: `Đã cập nhật trạng thái thành: ${statusMessages[status]}`
    });
  } catch (error: any) {
    console.error('Error updating menu item status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái',
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/menu/items/:id
 * Xóa món ăn (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await menuItemService.delete(id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa món ăn',
      error: error.message
    });
  }
});

router.post('/:id/modifiers', async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // menuItemId
        const { modifier_group_ids } = req.body;
        const restaurantId = req.headers['x-restaurant-id'] as string;

        // Gọi hàm từ service đã có sẵn
        await modifierGroupService.attachToMenuItem(
            id,
            restaurantId,
            modifier_group_ids
        );

        res.json({ success: true, message: 'Gắn nhóm tùy chọn thành công' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export { router as menuItemsDbRouter };
