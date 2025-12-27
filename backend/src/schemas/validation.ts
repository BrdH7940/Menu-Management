import { z } from "zod";

// ===================
// CATEGORY SCHEMAS
// ===================

// Schema cho tạo danh mục
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
    .max(50, "Tên danh mục không được quá 50 ký tự")
    .trim(),
  description: z.string().max(500, "Mô tả không được quá 500 ký tự").optional(),
  display_order: z
    .number()
    .int("Thứ tự hiển thị phải là số nguyên")
    .min(0, "Thứ tự hiển thị phải >= 0")
    .optional()
    .default(0),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

// Schema cho cập nhật danh mục
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
    .max(50, "Tên danh mục không được quá 50 ký tự")
    .trim()
    .optional(),
  description: z.string().max(500, "Mô tả không được quá 500 ký tự").optional(),
  display_order: z
    .number()
    .int("Thứ tự hiển thị phải là số nguyên")
    .min(0, "Thứ tự hiển thị phải >= 0")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// ===================
// MENU ITEM SCHEMAS
// ===================

// Schema cho tạo món ăn
export const createMenuItemSchema = z.object({
  name: z
    .string()
    .min(2, "Tên món ăn phải có ít nhất 2 ký tự")
    .max(80, "Tên món ăn không được quá 80 ký tự")
    .trim(),
  category_id: z.string().uuid('ID danh mục không hợp lệ - vui lòng chọn danh mục'),
  price: z
    .number()
    .positive('Giá phải là số dương')
    .max(999999999, 'Giá không được quá 999,999,999đ'),
  description: z.string().max(1000, 'Mô tả không được quá 1000 ký tự').optional().nullable(),
  prep_time_minutes: z
    .number()
    .int("Thời gian chuẩn bị phải là số nguyên")
    .min(0, "Thời gian chuẩn bị phải >= 0")
    .max(240, "Thời gian chuẩn bị không được quá 240 phút")
    .optional()
    .default(0),
  status: z
    .enum(["available", "unavailable", "sold_out"])
    .optional()
    .default("available"),
  is_chef_recommended: z.boolean().optional().default(false),
});

// Schema cho cập nhật món ăn
export const updateMenuItemSchema = z.object({
  name: z
    .string()
    .min(2, "Tên món ăn phải có ít nhất 2 ký tự")
    .max(80, "Tên món ăn không được quá 80 ký tự")
    .trim()
    .optional(),
  category_id: z.string().uuid("ID danh mục không hợp lệ").optional(),
  price: z
    .number()
    .positive("Giá phải là số dương")
    .max(999999999, "Giá không được quá 999,999,999đ")
    .optional(),
  description: z
    .string()
    .max(1000, "Mô tả không được quá 1000 ký tự")
    .optional(),
  prep_time_minutes: z
    .number()
    .int("Thời gian chuẩn bị phải là số nguyên")
    .min(0, "Thời gian chuẩn bị phải >= 0")
    .max(240, "Thời gian chuẩn bị không được quá 240 phút")
    .optional(),
  status: z.enum(["available", "unavailable", "sold_out"]).optional(),
  is_chef_recommended: z.boolean().optional(),
});

// Schema cho query params khi lấy danh sách món ăn
export const menuItemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(10),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(["available", "unavailable", "sold_out"]).optional(),
  sort_by: z
    .enum(["created_at", "price", "name", "popularity"])
    .optional()
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Schema cho Modifier Option
export const ModifierOptionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Tên tùy chọn là bắt buộc'),
    price: z.number().min(0, 'Giá phải >= 0').default(0),
    is_default: z.boolean().default(false),
    display_order: z.number().int().min(0).default(0),
});

// Schema cho tạo Modifier Group
export const CreateModifierGroupSchema = z.object({
    name: z.string().min(1, 'Tên nhóm tùy chọn là bắt buộc'),
    description: z.string().optional().nullable(),
    is_required: z.boolean().default(false),
    min_selections: z.number().int().min(0).default(0),
    max_selections: z.number().int().min(1).default(1),
    selection_type: z.enum(['single', 'multiple']).default('single'),
    display_order: z.number().int().min(0).default(0),
    status: z.enum(['active', 'inactive']).default('active'),
    options: z.array(ModifierOptionSchema).optional().default([]),
});

// Schema cho cập nhật Modifier Group
export const UpdateModifierGroupSchema = CreateModifierGroupSchema.partial();

// Schema cho gắn Modifier Group vào Menu Item
// Cho phép mảng rỗng để xóa tất cả modifiers hoặc tạo món không có modifier
export const AttachModifierGroupSchema = z.object({
    modifier_group_ids: z.array(z.string().uuid()),
    display_orders: z.record(z.string(), z.number().int().min(0)).optional(),
});

// TypeScript types
export type CreateModifierGroupInput = z.infer<typeof CreateModifierGroupSchema>;
export type UpdateModifierGroupInput = z.infer<typeof UpdateModifierGroupSchema>;
export type AttachModifierGroupInput = z.infer<typeof AttachModifierGroupSchema>;
export type ModifierOptionInput = z.infer<typeof ModifierOptionSchema>;

// Types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type MenuItemQueryInput = z.infer<typeof menuItemQuerySchema>;
