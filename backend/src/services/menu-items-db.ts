import { query, queryOne } from '../db/connection.js';
import { CreateMenuItemInput, UpdateMenuItemInput, MenuItemQueryInput } from '../schemas/validation.js';

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  prep_time_minutes: number;
  status: 'available' | 'unavailable' | 'sold_out';
  is_chef_recommended: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Helper function để format giá tiền VND
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export class MenuItemService {
  /**
   * Tạo món ăn mới
   */
  async create(data: CreateMenuItemInput): Promise<MenuItem> {
    // Kiểm tra category tồn tại
    const category = await queryOne(
      `SELECT id FROM menu_categories WHERE id = $1 AND is_deleted = false`,
      [data.category_id]
    );
    
    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND: Danh mục không tồn tại');
    }

    // Kiểm tra tên món ăn trùng lặp
    const existing = await queryOne<MenuItem>(
      `SELECT id FROM menu_items WHERE LOWER(name) = LOWER($1) AND is_deleted = false`,
      [data.name]
    );
    
    if (existing) {
      throw new Error('DUPLICATE_NAME: Tên món ăn đã tồn tại');
    }

    const result = await queryOne<MenuItem>(
      `INSERT INTO menu_items (category_id, name, description, price, prep_time_minutes, status, is_chef_recommended)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.category_id,
        data.name,
        data.description || null,
        data.price,
        data.prep_time_minutes,
        data.status,
        data.is_chef_recommended
      ]
    );

    return result!;
  }

  /**
   * Lấy danh sách món ăn với filter, sort, pagination
   */
  async getAll(params: MenuItemQueryInput): Promise<PaginatedResult<MenuItem>> {
    const { page, limit, search, category_id, status, sort_by, sort_order } = params;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = ['m.is_deleted = false'];
    const values: any[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`LOWER(m.name) LIKE LOWER($${paramCount++})`);
      values.push(`%${search}%`);
    }

    if (category_id) {
      conditions.push(`m.category_id = $${paramCount++}`);
      values.push(category_id);
    }

    if (status) {
      conditions.push(`m.status = $${paramCount++}`);
      values.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // Sort
    const validSortFields: Record<string, string> = {
      created_at: 'm.created_at',
      price: 'm.price',
      name: 'm.name'
    };
    const sortField = validSortFields[sort_by] || 'm.created_at';
    const order = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Count total
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM menu_items m WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult[0].count, 10);

    // Get items
    const items = await query<MenuItem & { category_name: string }>(
      `SELECT m.*, c.name as category_name
       FROM menu_items m
       LEFT JOIN menu_categories c ON m.category_id = c.id
       WHERE ${whereClause}
       ORDER BY ${sortField} ${order}
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy món ăn theo ID
   */
  async getById(id: string): Promise<MenuItem | null> {
    const item = await queryOne<MenuItem & { category_name: string }>(
      `SELECT m.*, c.name as category_name
       FROM menu_items m
       LEFT JOIN menu_categories c ON m.category_id = c.id
       WHERE m.id = $1 AND m.is_deleted = false`,
      [id]
    );

    return item;
  }

  /**
   * Cập nhật món ăn
   */
  async update(id: string, data: UpdateMenuItemInput): Promise<MenuItem | null> {
    // Kiểm tra món ăn tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    // Nếu cập nhật category, kiểm tra category tồn tại
    if (data.category_id) {
      const category = await queryOne(
        `SELECT id FROM menu_categories WHERE id = $1 AND is_deleted = false`,
        [data.category_id]
      );
      
      if (!category) {
        throw new Error('CATEGORY_NOT_FOUND: Danh mục không tồn tại');
      }
    }

    // Nếu cập nhật tên, kiểm tra trùng lặp
    if (data.name) {
      const duplicate = await queryOne<MenuItem>(
        `SELECT id FROM menu_items 
         WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_deleted = false`,
        [data.name, id]
      );
      
      if (duplicate) {
        throw new Error('DUPLICATE_NAME: Tên món ăn đã tồn tại');
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(data.category_id);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(data.price);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.prep_time_minutes !== undefined) {
      updates.push(`prep_time_minutes = $${paramCount++}`);
      values.push(data.prep_time_minutes);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.is_chef_recommended !== undefined) {
      updates.push(`is_chef_recommended = $${paramCount++}`);
      values.push(data.is_chef_recommended);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await queryOne<MenuItem>(
      `UPDATE menu_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND is_deleted = false
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Soft delete món ăn
   * Món ăn sẽ bị ẩn khỏi menu nhưng vẫn giữ trong lịch sử đơn hàng
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // Kiểm tra món ăn tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return { success: false, message: 'Món ăn không tồn tại' };
    }

    // Soft delete - chỉ đánh dấu is_deleted = true
    await query(
      `UPDATE menu_items SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    return { 
      success: true, 
      message: 'Đã xóa món ăn thành công. Món ăn vẫn được giữ trong lịch sử đơn hàng.' 
    };
  }

  /**
   * Cập nhật trạng thái món ăn nhanh
   */
  async updateStatus(id: string, status: 'available' | 'unavailable' | 'sold_out'): Promise<MenuItem | null> {
    const result = await queryOne<MenuItem>(
      `UPDATE menu_items 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND is_deleted = false
       RETURNING *`,
      [status, id]
    );

    return result;
  }
}

export const menuItemService = new MenuItemService();
