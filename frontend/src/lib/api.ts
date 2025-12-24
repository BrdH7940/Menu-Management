import { MenuItem, MenuHealth, MenuItemListResponse, MenuItemFilters, MenuItemPhoto, Category } from '@/types/menu';

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

export const menuApi = {
  // Fetch menu items with filtering, sorting, pagination
  getItems: async (filters?: MenuItemFilters): Promise<MenuItemListResponse> => {
    const queryString = filters ? `?${buildQueryString(filters)}` : '';
    const response = await fetch(`${API_BASE}/admin/menu/items${queryString}`, {
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001', // Mock restaurant ID
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    
    const data = await response.json();
    
    // Transform backend response to frontend format
    return {
      items: data.items.map((item: any) => ({
        ...item,
        imageUrl: item.primaryPhotoUrl,
        isAvailable: item.status === 'available',
      })),
      pagination: data.pagination,
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
    
    const item = await response.json();
    return {
      ...item,
      imageUrl: item.primaryPhotoUrl || (item.photos && item.photos.length > 0 ? item.photos[0].url : undefined),
      isAvailable: item.status === 'available',
    };
  },

  // Update menu item
  updateItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    const { imageUrl, isAvailable, ...updateData } = data;
    const payload: any = { ...updateData };
    
    if (isAvailable !== undefined) {
      payload.status = isAvailable ? 'available' : 'unavailable';
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
      throw new Error('Failed to update menu item');
    }
    
    const item = await response.json();
    return {
      ...item,
      imageUrl: item.primaryPhotoUrl,
      isAvailable: item.status === 'available',
    };
  },

  // Get categories
  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE}/admin/menu/categories`, {
      headers: {
        'x-restaurant-id': '00000000-0000-0000-0000-000000000001',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return response.json();
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

