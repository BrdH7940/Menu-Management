import { query, queryOne } from '../db/connection.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/validation.js';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  status: 'active' | 'inactive';
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  item_count?: number;
}

export class CategoryService {
  /**
   * Tạo danh mục mới
   */
  async create(data: CreateCategoryInput): Promise<Category> {
    // Kiểm tra tên trùng lặp
    const existing = await queryOne<Category>(
      `SELECT id FROM menu_categories WHERE LOWER(name) = LOWER($1) AND is_deleted = false`,
      [data.name]
    );
    
    if (existing) {
      throw new Error('DUPLICATE_NAME: Tên danh mục đã tồn tại');
    }

    const result = await queryOne<Category>(
      `INSERT INTO menu_categories (name, description, display_order, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.description || null, data.display_order, data.status]
    );

    return result!;
  }

  /**
   * Lấy tất cả danh mục (không bao gồm đã xóa)
   */
  async getAll(sortBy: string = 'display_order', sortOrder: string = 'asc'): Promise<Category[]> {
    const validSortFields = ['display_order', 'name', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'display_order';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const categories = await query<Category & { item_count: string }>(
      `SELECT c.*, 
              COALESCE(COUNT(m.id) FILTER (WHERE m.is_deleted = false), 0) as item_count
       FROM menu_categories c
       LEFT JOIN menu_items m ON c.id = m.category_id
       WHERE c.is_deleted = false
       GROUP BY c.id
       ORDER BY c.${sortField} ${order}`
    );

    return categories.map(cat => ({
      ...cat,
      item_count: parseInt(cat.item_count, 10)
    }));
  }

  /**
   * Lấy danh mục theo ID
   */
  async getById(id: string): Promise<Category | null> {
    const category = await queryOne<Category & { item_count: string }>(
      `SELECT c.*, 
              COALESCE(COUNT(m.id) FILTER (WHERE m.is_deleted = false), 0) as item_count
       FROM menu_categories c
       LEFT JOIN menu_items m ON c.id = m.category_id
       WHERE c.id = $1 AND c.is_deleted = false
       GROUP BY c.id`,
      [id]
    );

    if (!category) return null;

    return {
      ...category,
      item_count: parseInt(category.item_count, 10)
    };
  }

  /**
   * Cập nhật danh mục
   */
  async update(id: string, data: UpdateCategoryInput): Promise<Category | null> {
    // Kiểm tra danh mục tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    // Nếu cập nhật tên, kiểm tra trùng lặp
    if (data.name) {
      const duplicate = await queryOne<Category>(
        `SELECT id FROM menu_categories 
         WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_deleted = false`,
        [data.name, id]
      );
      
      if (duplicate) {
        throw new Error('DUPLICATE_NAME: Tên danh mục đã tồn tại');
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
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(data.display_order);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await queryOne<Category>(
      `UPDATE menu_categories 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND is_deleted = false
       RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Soft delete danh mục
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // Kiểm tra danh mục tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return { success: false, message: 'Danh mục không tồn tại' };
    }

    // Kiểm tra còn món ăn active trong danh mục không
    const activeItems = await query(
      `SELECT COUNT(*) as count FROM menu_items 
       WHERE category_id = $1 AND is_deleted = false`,
      [id]
    );

    if (parseInt(activeItems[0].count, 10) > 0) {
      return { 
        success: false, 
        message: 'Không thể xóa danh mục vì còn chứa món ăn. Vui lòng xóa hoặc chuyển món ăn sang danh mục khác trước.' 
      };
    }

    // Soft delete
    await query(
      `UPDATE menu_categories SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    return { success: true, message: 'Đã xóa danh mục thành công' };
  }
}

export const categoryService = new CategoryService();
