import { Router, Request, Response } from 'express';
import { categoryService } from '../services/categories-supabase.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/validation.js';
import { ZodError } from 'zod';

const router = Router();

// Helper function để xử lý lỗi Zod
function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}

/**
 * GET /api/admin/menu/categories
 * Lấy tất cả danh mục
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const sortBy = (req.query.sort_by as string) || 'display_order';
    const sortOrder = (req.query.sort_order as string) || 'asc';
    
    const categories = await categoryService.getAll(sortBy, sortOrder);
    
    res.json({
      success: true,
      data: categories,
      message: 'Lấy danh sách danh mục thành công'
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/menu/categories/:id
 * Lấy chi tiết danh mục
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await categoryService.getById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết danh mục',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/menu/categories
 * Tạo danh mục mới
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createCategorySchema.parse(req.body);
    
    const category = await categoryService.create(validatedData);
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Tạo danh mục thành công'
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    
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
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo danh mục',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/menu/categories/:id
 * Cập nhật danh mục
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate input
    const validatedData = updateCategorySchema.parse(req.body);
    
    const category = await categoryService.update(id, validatedData);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: category,
      message: 'Cập nhật danh mục thành công'
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    
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
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật danh mục',
      error: error.message
    });
  }
});

/**
 * PATCH /api/admin/menu/categories/:id/status
 * Cập nhật trạng thái danh mục
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive'
      });
    }
    
    const category = await categoryService.update(id, { status });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: category,
      message: `Đã ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} danh mục`
    });
  } catch (error: any) {
    console.error('Error updating category status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái',
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/menu/categories/:id
 * Xóa danh mục (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await categoryService.delete(id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa danh mục',
      error: error.message
    });
  }
});

export { router as categoriesRouter };
