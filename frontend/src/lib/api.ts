import { MenuItem, MenuHealth, MenuItemListResponse, MenuItemFilters, MenuItemPhoto, Category, MenuCategory } from '@/types/menu';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to build query string
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

// Helper format giá tiền VND
export function formatPriceVND(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export const menuApi = {
  // Fetch menu items with filtering, sorting, pagination
  getItems: async (filters?: MenuItemFilters): Promise<MenuItemListResponse> => {
    // Map frontend filter names to backend parameter names
    const backendParams: Record<string, any> = {};
    if (filters) {
      if (filters.page) backendParams.page = filters.page;
      if (filters.limit) backendParams.limit = filters.limit;
      if (filters.q) backendParams.search = filters.q;  // q -> search
      if (filters.categoryId) backendParams.category_id = filters.categoryId;  // categoryId -> category_id
      if (filters.status) backendParams.status = filters.status;
      if (filters.sort) backendParams.sort_by = filters.sort;  // sort -> sort_by
      if (filters.order) backendParams.sort_order = filters.order;  // order -> sort_order
    }
    
    const queryString = Object.keys(backendParams).length > 0 ? `?${buildQueryString(backendParams)}` : '';
    const response = await fetch(`${API_BASE}/admin/menu/items${queryString}`, {
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001', // Mock restaurant ID
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    
    const result = await response.json();
    // Backend trả về { success: true, data: [...], pagination: {...} }
    const items = result.data || [];
    const backendPagination = result.pagination || {};
    
    // Transform backend response to frontend format
    return {
      items: items.map((item: any) => ({
        ...item,
        categoryId: item.category_id,
        categoryName: item.category_name,
        prepTimeMinutes: item.prep_time_minutes,
        isChefRecommended: item.is_chef_recommended,
        imageUrl: item.primary_photo_url || item.primaryPhotoUrl,
        isAvailable: item.status === 'available',
        priceFormatted: formatPriceVND(item.price),
        photos: item.photos?.map((p: any) => ({
          id: p.id,
          url: p.url,
          isPrimary: p.is_primary,
          createdAt: p.created_at,
        })) || [],
      })),
      pagination: {
        page: backendPagination.page || 1,
        limit: backendPagination.limit || 20,
        total: backendPagination.total || 0,
        totalPages: backendPagination.total_pages || backendPagination.totalPages || 1,
      },
    };
  },

  // Get single menu item
  getItem: async (id: string): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE}/admin/menu/items/${id}`, {
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu item');
    }
    
    const result = await response.json();
    const item = result.data || result;
    return {
      ...item,
      categoryId: item.category_id,
      categoryName: item.category_name,
      prepTimeMinutes: item.prep_time_minutes,
      isChefRecommended: item.is_chef_recommended,
      imageUrl: item.primary_photo_url || item.primaryPhotoUrl || (item.photos && item.photos.length > 0 ? item.photos[0].url : undefined),
      isAvailable: item.status === 'available',
      priceFormatted: formatPriceVND(item.price),
      photos: item.photos?.map((p: any) => ({
        id: p.id,
        url: p.url,
        isPrimary: p.is_primary,
        createdAt: p.created_at,
      })) || [],
    };
  },

  // Create menu item
  createItem: async (data: Partial<MenuItem>): Promise<MenuItem> => {
    const payload = {
      name: data.name,
      category_id: data.categoryId,
      price: data.price,
      description: data.description,
      prep_time_minutes: data.prepTimeMinutes || 0,
      status: data.status || 'available',
      is_chef_recommended: data.isChefRecommended || false,
    };
    
    const response = await fetch(`${API_BASE}/admin/menu/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create menu item');
    }
    
    const result = await response.json();
    const item = result.data;
    return {
      ...item,
      categoryId: item.category_id,
      priceFormatted: formatPriceVND(item.price),
    };
  },

  // Update menu item
  updateItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    const payload: any = {};
    
    if (data.name !== undefined) payload.name = data.name;
    if (data.categoryId !== undefined) payload.category_id = data.categoryId;
    if (data.price !== undefined) payload.price = data.price;
    if (data.description !== undefined) payload.description = data.description;
    if (data.prepTimeMinutes !== undefined) payload.prep_time_minutes = data.prepTimeMinutes;
    if (data.status !== undefined) payload.status = data.status;
    if (data.isChefRecommended !== undefined) payload.is_chef_recommended = data.isChefRecommended;
    if (data.isAvailable !== undefined) {
      payload.status = data.isAvailable ? 'available' : 'unavailable';
    }
    
    const response = await fetch(`${API_BASE}/admin/menu/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update menu item');
    }
    
    const result = await response.json();
    const item = result.data || result;
    return {
      ...item,
      categoryId: item.category_id,
      categoryName: item.category_name,
      imageUrl: item.primaryPhotoUrl,
      isAvailable: item.status === 'available',
      priceFormatted: formatPriceVND(item.price),
    };
  },

  // Delete menu item (soft delete)
  deleteItem: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/admin/menu/items/${id}`, {
      method: 'DELETE',
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete menu item');
    }
  },

  // Get categories
  getCategories: async (): Promise<MenuCategory[]> => {
    const response = await fetch(`${API_BASE}/admin/menu/categories`, {
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const result = await response.json();
    // Backend trả về { success: true, data: [...] }
    const categories = result.data || [];
    return categories.map((cat: any) => ({
      ...cat,
      displayOrder: cat.display_order,
      itemCount: cat.item_count,
    })) as MenuCategory[];
  },

  // Create category
  createCategory: async (data: any): Promise<Category> => {
    const payload = {
      name: data.name,
      description: data.description,
      display_order: data.display_order ?? data.displayOrder ?? 0,
      status: 'active',
    };
    
    const response = await fetch(`${API_BASE}/admin/menu/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create category');
    }
    
    const result = await response.json();
    return {
      ...result.data,
      displayOrder: result.data.display_order,
    };
  },

  // Update category
  updateCategory: async (id: string, data: any): Promise<Category> => {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.display_order !== undefined) payload.display_order = data.display_order;
    if (data.displayOrder !== undefined) payload.display_order = data.displayOrder;
    
    const response = await fetch(`${API_BASE}/admin/menu/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category');
    }
    
    const result = await response.json();
    return {
      ...result.data,
      displayOrder: result.data.display_order,
    };
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/admin/menu/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }
  },

  // Upload photos
  uploadPhotos: async (itemId: string, files: File[]): Promise<MenuItemPhoto[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    
    const response = await fetch(`${API_BASE}/admin/menu/items/${itemId}/photos`, {
      method: 'POST',
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload photos');
    }
    
    const data = await response.json();
    return data.photos;
  },

  // Delete photo
  deletePhoto: async (itemId: string, photoId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/admin/menu/items/${itemId}/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete photo');
    }
  },

  // Set primary photo
  setPrimaryPhoto: async (itemId: string, photoId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/admin/menu/items/${itemId}/photos/${photoId}/primary`, {
      method: 'PATCH',
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to set primary photo');
    }
  },

  // Get menu health
  getMenuHealth: async (): Promise<MenuHealth> => {
    const response = await menuApi.getItems({ limit: 1000 });
    const items = response.items;
    return {
      totalItems: response.pagination.total,
      availableItems: items.filter(i => i.status === 'available').length,
      soldOutItems: items.filter(i => i.status === 'sold_out').length,
      itemsWithoutImage: items.filter(i => !i.primaryPhotoUrl && !i.imageUrl).length,
      itemsWithoutDescription: items.filter(i => !i.description).length,
    };
  },
};

