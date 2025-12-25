import { supabase } from "../db/supabase.js";
import {
  CreateMenuItemInput,
  UpdateMenuItemInput,
  MenuItemQueryInput,
} from "../schemas/validation.js";

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  prep_time_minutes: number;
  status: "available" | "unavailable" | "sold_out";
  is_chef_recommended: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
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
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export class MenuItemService {
  /**
   * Tạo món ăn mới
   */
  async create(data: CreateMenuItemInput): Promise<MenuItem> {
    // Kiểm tra category tồn tại
    const { data: category } = await supabase
      .from("menu_categories")
      .select("id")
      .eq("id", data.category_id)
      .eq("is_deleted", false)
      .single();

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND: Danh mục không tồn tại");
    }

    // Kiểm tra tên món ăn trùng lặp
    const { data: existing } = await supabase
      .from("menu_items")
      .select("id")
      .ilike("name", data.name)
      .eq("is_deleted", false)
      .single();

    if (existing) {
      throw new Error("DUPLICATE_NAME: Tên món ăn đã tồn tại");
    }

    const { data: item, error } = await supabase
      .from("menu_items")
      .insert({
        category_id: data.category_id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        prep_time_minutes: data.prep_time_minutes ?? 0,
        status: data.status ?? "available",
        is_chef_recommended: data.is_chef_recommended ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating menu item:", error);
      throw new Error("Không thể tạo món ăn: " + error.message);
    }

    return item;
  }

  /**
   * Lấy danh sách món ăn với filter, sort, pagination
   */
  async getAll(params: MenuItemQueryInput): Promise<PaginatedResult<MenuItem>> {
    const { page, limit, search, category_id, status, sort_by, sort_order } =
      params;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("menu_items")
      .select(
        `
        *,
        menu_categories!inner(name),
        menu_item_photos(id, url, is_primary, display_order, created_at)
      `,
        { count: "exact" }
      )
      .eq("is_deleted", false);

    // Apply filters
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Handle popularity sorting separately (requires fetching order counts)
    if (sort_by === "popularity") {
      // Fetch all items first (without pagination) to calculate popularity
      const { data: allItems, error, count } = await query;

      if (error) {
        console.error("Error fetching menu items:", error);
        throw new Error("Không thể lấy danh sách món ăn");
      }

      // Get popularity counts for all items
      const itemIds = (allItems || []).map((item: any) => item.id);
      const popularityMap = new Map<string, number>();

      if (itemIds.length > 0) {
        // Try to fetch order counts from order_items table
        // If table doesn't exist, all items will have popularity 0
        try {
          const { data: orderCounts } = await supabase
            .from("order_items")
            .select("menu_item_id")
            .in("menu_item_id", itemIds);

          // Count occurrences
          if (orderCounts) {
            orderCounts.forEach((oi: any) => {
              const current = popularityMap.get(oi.menu_item_id) || 0;
              popularityMap.set(oi.menu_item_id, current + 1);
            });
          }
        } catch (e) {
          // Table might not exist, continue with popularity 0 for all items
          console.warn(
            "Could not fetch popularity data, using default value 0"
          );
        }
      }

      // Transform and add popularity score
      const transformedItems = (allItems || []).map((item: any) => {
        const photos = item.menu_item_photos || [];
        const primaryPhoto = photos.find((p: any) => p.is_primary);

        return {
          ...item,
          category_name: item.menu_categories?.name,
          photos: photos,
          primary_photo_url: primaryPhoto?.url || photos[0]?.url || null,
          popularity_score: popularityMap.get(item.id) || 0,
          menu_categories: undefined,
          menu_item_photos: undefined,
        };
      });

      // Sort by popularity
      transformedItems.sort((a: any, b: any) => {
        const diff = a.popularity_score - b.popularity_score;
        // Secondary sort by created_at if popularity is equal
        if (diff === 0) {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return sort_order === "asc" ? dateA - dateB : dateB - dateA;
        }
        return sort_order === "asc" ? diff : -diff;
      });

      // Apply pagination after sorting
      const total = count || 0;
      const paginatedItems = transformedItems.slice(offset, offset + limit);

      return {
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    }

    // Apply sorting for non-popularity sorts
    const sortField = sort_by || "created_at";
    const ascending = sort_order === "asc";
    query = query.order(sortField, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Error fetching menu items:", error);
      throw new Error("Không thể lấy danh sách món ăn");
    }

    // Transform data to include category_name and photos
    const transformedItems = (items || []).map((item: any) => {
      const photos = item.menu_item_photos || [];
      const primaryPhoto = photos.find((p: any) => p.is_primary);

      return {
        ...item,
        category_name: item.menu_categories?.name,
        photos: photos,
        primary_photo_url: primaryPhoto?.url || photos[0]?.url || null,
        menu_categories: undefined,
        menu_item_photos: undefined,
      };
    });

    const total = count || 0;

    return {
      data: transformedItems,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy món ăn theo ID
   */
  async getById(id: string): Promise<MenuItem | null> {
    const { data: item, error } = await supabase
      .from("menu_items")
      .select(
        `
        *,
        menu_categories!inner(name),
        menu_item_photos(id, url, is_primary, display_order, created_at)
      `
      )
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error || !item) {
      return null;
    }

    const photos = (item as any).menu_item_photos || [];
    const primaryPhoto = photos.find((p: any) => p.is_primary);

    return {
      ...item,
      category_name: (item as any).menu_categories?.name,
      photos: photos,
      primary_photo_url: primaryPhoto?.url || photos[0]?.url || null,
      menu_categories: undefined,
      menu_item_photos: undefined,
    } as MenuItem;
  }

  /**
   * Cập nhật món ăn
   */
  async update(
    id: string,
    data: UpdateMenuItemInput
  ): Promise<MenuItem | null> {
    // Kiểm tra món ăn tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    // Nếu cập nhật category, kiểm tra category tồn tại
    if (data.category_id) {
      const { data: category } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("id", data.category_id)
        .eq("is_deleted", false)
        .single();

      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND: Danh mục không tồn tại");
      }
    }

    // Nếu cập nhật tên, kiểm tra trùng lặp
    if (data.name) {
      const { data: duplicate } = await supabase
        .from("menu_items")
        .select("id")
        .ilike("name", data.name)
        .neq("id", id)
        .eq("is_deleted", false)
        .single();

      if (duplicate) {
        throw new Error("DUPLICATE_NAME: Tên món ăn đã tồn tại");
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category_id !== undefined)
      updateData.category_id = data.category_id;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.prep_time_minutes !== undefined)
      updateData.prep_time_minutes = data.prep_time_minutes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_chef_recommended !== undefined)
      updateData.is_chef_recommended = data.is_chef_recommended;

    const { data: item, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) {
      console.error("Error updating menu item:", error);
      throw new Error("Không thể cập nhật món ăn");
    }

    return item;
  }

  /**
   * Soft delete món ăn
   * Món ăn sẽ bị ẩn khỏi menu nhưng vẫn giữ trong lịch sử đơn hàng
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // Kiểm tra món ăn tồn tại
    const existing = await this.getById(id);
    if (!existing) {
      return { success: false, message: "Món ăn không tồn tại" };
    }

    // Soft delete - chỉ đánh dấu is_deleted = true
    const { error } = await supabase
      .from("menu_items")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting menu item:", error);
      return { success: false, message: "Không thể xóa món ăn" };
    }

    return {
      success: true,
      message:
        "Đã xóa món ăn thành công. Món ăn vẫn được giữ trong lịch sử đơn hàng.",
    };
  }

  /**
   * Cập nhật trạng thái món ăn nhanh
   */
  async updateStatus(
    id: string,
    status: "available" | "unavailable" | "sold_out"
  ): Promise<MenuItem | null> {
    const { data: item, error } = await supabase
      .from("menu_items")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) {
      console.error("Error updating menu item status:", error);
      return null;
    }

    return item;
  }
}

export const menuItemService = new MenuItemService();
