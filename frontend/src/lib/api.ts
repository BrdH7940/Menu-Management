import { MenuItem, MenuHealth, MenuItemListResponse, MenuItemFilters, MenuItemPhoto, Category, MenuCategory } from '@/types/menu';
import { GuestMenuResponse, GuestMenuFilters } from '@/types/menu';
import { ModifierGroup } from '@/types/menu';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const MOCK_RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

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
    // --- MENU ITEMS ---
    getItems: async (filters?: MenuItemFilters): Promise<MenuItemListResponse> => {
        const backendParams: Record<string, any> = {};
        if (filters) {
            if (filters.page) backendParams.page = filters.page;
            if (filters.limit) backendParams.limit = filters.limit;
            if (filters.q) backendParams.search = filters.q;
            if (filters.categoryId) backendParams.category_id = filters.categoryId;
            if (filters.status) backendParams.status = filters.status;
            if (filters.sort) backendParams.sort_by = filters.sort;
            if (filters.order) backendParams.sort_order = filters.order;
        }

        const queryString = Object.keys(backendParams).length > 0 ? `?${buildQueryString(backendParams)}` : '';
        const response = await fetch(`${API_BASE}/admin/menu/items${queryString}`, {
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });

        if (!response.ok) throw new Error('Failed to fetch menu items');

        const result = await response.json();
        const items = result.data || [];

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
                    id: p.id, url: p.url, isPrimary: p.is_primary, createdAt: p.created_at,
                })) || [],
            })),
            pagination: result.pagination,
        };
    },

    getItem: async (id: string): Promise<MenuItem> => {
        const response = await fetch(`${API_BASE}/admin/menu/items/${id}`, {
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to fetch menu item');
        const result = await response.json();
        const item = result.data || result;
        return {
            ...item,
            categoryId: item.category_id,
            categoryName: item.category_name,
            prepTimeMinutes: item.prep_time_minutes,
            isChefRecommended: item.is_chef_recommended,
            imageUrl: item.primary_photo_url || item.primaryPhotoUrl || (item.photos?.[0]?.url),
            isAvailable: item.status === 'available',
            priceFormatted: formatPriceVND(item.price),
            photos: item.photos?.map((p: any) => ({
                id: p.id, url: p.url, isPrimary: p.is_primary, createdAt: p.created_at,
            })) || [],
            modifierGroups: item.modifierGroups?.map((group: any) => ({
                id: group.id,
                name: group.name,
                isRequired: group.is_required,
                selectionType: group.selection_type,
                options: group.options?.map((opt: any) => ({
                    id: opt.id, name: opt.name, price: opt.price
                })) || []
            })) || []
        };
    },

    createItem: async (data: Partial<MenuItem>): Promise<MenuItem> => {
        const payload = {
            name: data.name,
            category_id: data.categoryId,
            price: data.price,
            description: data.description || '',
            prep_time_minutes: data.prepTimeMinutes || 0,
            status: data.status || 'available',
            is_chef_recommended: data.isChefRecommended || false,
        };
        
        console.log('Creating item with payload:', payload);
        
        const response = await fetch(`${API_BASE}/admin/menu/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Create item error:', errorData);
            throw new Error(errorData.message || errorData.error || 'Failed to create menu item');
        }
        
        const result = await response.json();
        return { ...result.data, categoryId: result.data.category_id, priceFormatted: formatPriceVND(result.data.price) };
    },

    updateItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.categoryId !== undefined) payload.category_id = data.categoryId;
        if (data.price !== undefined) payload.price = data.price;
        if (data.description !== undefined) payload.description = data.description;
        if (data.prepTimeMinutes !== undefined) payload.prep_time_minutes = data.prepTimeMinutes;
        if (data.status !== undefined) payload.status = data.status;
        if (data.isChefRecommended !== undefined) payload.is_chef_recommended = data.isChefRecommended;
        if (data.isAvailable !== undefined) payload.status = data.isAvailable ? 'available' : 'unavailable';

        const response = await fetch(`${API_BASE}/admin/menu/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update menu item');
        const result = await response.json();
        const item = result.data || result;
        return {
            ...item,
            categoryId: item.category_id,
            categoryName: item.category_name,
            isAvailable: item.status === 'available',
            priceFormatted: formatPriceVND(item.price),
        };
    },

    deleteItem: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/admin/menu/items/${id}`, {
            method: 'DELETE',
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to delete menu item');
    },

    // --- CATEGORIES ---
    getCategories: async (): Promise<MenuCategory[]> => {
        const response = await fetch(`${API_BASE}/admin/menu/categories`, {
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        const result = await response.json();
        return (result.data || []).map((cat: any) => ({
            ...cat, displayOrder: cat.display_order, itemCount: cat.item_count,
        }));
    },

    createCategory: async (data: any): Promise<Category> => {
        const payload = {
            name: data.name,
            description: data.description,
            display_order: data.display_order ?? data.displayOrder ?? 0,
            status: 'active',
        };
        const response = await fetch(`${API_BASE}/admin/menu/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create category');
        const result = await response.json();
        return { ...result.data, displayOrder: result.data.display_order };
    },

    updateCategory: async (id: string, data: any): Promise<Category> => {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.description !== undefined) payload.description = data.description;
        if (data.displayOrder !== undefined || data.display_order !== undefined)
            payload.display_order = data.displayOrder ?? data.display_order;

        const response = await fetch(`${API_BASE}/admin/menu/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update category');
        const result = await response.json();
        return { ...result.data, displayOrder: result.data.display_order };
    },

    deleteCategory: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/admin/menu/categories/${id}`, {
            method: 'DELETE',
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to delete category');
    },

    // --- PHOTOS ---
    uploadPhotos: async (itemId: string, files: File[]): Promise<MenuItemPhoto[]> => {
        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));
        const response = await fetch(`${API_BASE}/admin/menu/items/${itemId}/photos`, {
            method: 'POST',
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload photos');
        const data = await response.json();
        return data.photos;
    },

    deletePhoto: async (itemId: string, photoId: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/admin/menu/items/${itemId}/photos/${photoId}`, {
            method: 'DELETE',
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to delete photo');
    },

    setPrimaryPhoto: async (itemId: string, photoId: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/admin/menu/items/${itemId}/photos/${photoId}/primary`, {
            method: 'PATCH',
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to set primary photo');
    },

    // --- MODIFIER GROUPS ---
    getModifierGroups: async (): Promise<ModifierGroup[]> => {
        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups`, {
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to fetch modifier groups');
        const result = await response.json();
        return (result.data || []).map((group: any) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            isRequired: group.is_required,
            minSelections: group.min_selections,
            maxSelections: group.max_selections,
            selectionType: group.selection_type,
            displayOrder: group.display_order,
            status: group.status,
            restaurantId: group.restaurant_id,
            options: (group.options || []).map((opt: any) => ({
                id: opt.id, name: opt.name, price: opt.price, isDefault: opt.is_default, displayOrder: opt.display_order,
            })),
        }));
    },

    /**
     * Lưu danh sách Modifier Groups (Hàm gộp xử lý Create/Update hàng loạt)
     * Phù hợp cho logic tách Dialog quản lý riêng
     */
    saveModifierGroups: async (groups: ModifierGroup[]): Promise<void> => {
        const payload = groups.map(group => ({
            id: group.id.startsWith('temp-') ? undefined : group.id, // temp-id từ frontend sẽ được coi là tạo mới
            name: group.name,
            description: group.description,
            is_required: group.isRequired,
            min_selections: group.minSelections,
            max_selections: group.maxSelections,
            selection_type: group.selectionType,
            display_order: group.displayOrder,
            status: group.status,
            options: group.options.map(opt => ({
                id: opt.id?.startsWith('opt-') ? undefined : opt.id,
                name: opt.name,
                price: opt.price,
                is_default: opt.isDefault,
                display_order: opt.displayOrder
            }))
        }));

        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify({ groups: payload }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save modifier groups');
        }
    },

    createModifierGroup: async (data: Partial<ModifierGroup>): Promise<ModifierGroup> => {
        const payload = {
            name: data.name,
            is_required: data.isRequired ?? false,
            min_selections: data.minSelections ?? 0,
            max_selections: data.maxSelections ?? 1,
            selection_type: data.selectionType ?? 'single',
            display_order: data.displayOrder ?? 0,
            status: data.status ?? 'active',
            options: (data.options || []).map(opt => ({
                name: opt.name, price: opt.price ?? 0, is_default: opt.isDefault ?? false, display_order: opt.displayOrder ?? 0,
            })),
        };

        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create modifier group');
        const result = await response.json();
        return result.data;
    },

    updateModifierGroup: async (id: string, data: Partial<ModifierGroup>): Promise<ModifierGroup> => {
        const payload: any = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.isRequired !== undefined) payload.is_required = data.isRequired;
        if (data.selectionType !== undefined) payload.selection_type = data.selectionType;
        if (data.options !== undefined) {
            payload.options = data.options.map(opt => ({
                id: opt.id, name: opt.name, price: opt.price, is_default: opt.isDefault, display_order: opt.displayOrder,
            }));
        }

        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-restaurant-id': MOCK_RESTAURANT_ID },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update modifier group');
        const result = await response.json();
        return result.data;
    },

    deleteModifierGroup: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups/${id}`, {
            method: 'DELETE',
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to delete modifier group');
    },

    

    // --- GUEST / PUBLIC API ---
    getGuestMenu: async (filters?: GuestMenuFilters): Promise<GuestMenuResponse> => {
        const backendParams: Record<string, any> = {};
        if (filters) {
            if (filters.q) backendParams.search = filters.q;
            if (filters.categoryId) backendParams.category_id = filters.categoryId;
            if (filters.sortBy) backendParams.sort_by = filters.sortBy;
            if (filters.isChefRecommended) backendParams.is_chef_recommended = true;
        }
        const queryString = buildQueryString(backendParams);
        const response = await fetch(`${API_BASE}/menu${queryString ? '?' + queryString : ''}`, {
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to fetch guest menu');
        const result = await response.json();
        return {
            restaurant_name: result.data?.restaurant_name,
            categories: result.data?.categories?.filter((cat: any) => cat.status === 'active').map((cat: any) => ({
                ...cat,
                items: cat.items?.filter((item: any) => item.status === 'available').map((item: any) => ({
                    ...item,
                    categoryId: item.category_id,
                    primaryPhotoUrl: item.primary_photo_url || item.photos?.[0]?.url,
                    modifierGroups: item.modifier_groups?.map((group: any) => ({
                        ...group,
                        isRequired: group.is_required,
                        selectionType: group.selection_type,
                        options: group.options?.map((opt: any) => ({ ...opt, price: opt.price_adjustment || opt.price })),
                    })),
                })),
            })) || [],
        };
    },

    // --- UTILS ---
    getMenuHealth: async (): Promise<MenuHealth> => {
        const response = await menuApi.getItems({ limit: 1000 });
        const items = response.items;
        return {
            totalItems: response.pagination.total,
            availableItems: items.filter(i => i.status === 'available').length,
            soldOutItems: items.filter(i => i.status === 'sold_out').length,
            itemsWithoutImage: items.filter(i => !i.imageUrl).length,
            itemsWithoutDescription: items.filter(i => !i.description).length,
        };
    },

    calculateItemTotal: (basePrice: number, modifierGroups: ModifierGroup[], selections: Record<string, string[]>): number => {
        let total = basePrice;
        modifierGroups.forEach(group => {
            (selections[group.id] || []).forEach(optId => {
                const option = group.options.find(o => o.id === optId);
                if (option) total += option.price;
            });
        });
        return total;
    },

    validateModifierSelections: (modifierGroups: ModifierGroup[], selections: Record<string, string[]>): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        modifierGroups.forEach(group => {
            const selected = selections[group.id] || [];
            if (group.isRequired && selected.length === 0) errors.push(`"${group.name}" là tùy chọn bắt buộc`);
            if (selected.length < (group.minSelections || 0)) errors.push(`"${group.name}" cần chọn ít nhất ${group.minSelections} tùy chọn`);
            if (selected.length > (group.maxSelections || 99)) errors.push(`"${group.name}" chỉ được chọn tối đa ${group.maxSelections} tùy chọn`);
        });
        return { valid: errors.length === 0, errors };
    },
    // Thêm vào menuApi trong api.ts
    getAttachedModifiers: async (itemId: string): Promise<ModifierGroup[]> => {
        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups/items/${itemId}/modifiers`, {
            headers: { 'x-restaurant-id': MOCK_RESTAURANT_ID },
        });
        if (!response.ok) throw new Error('Failed to fetch attached modifiers');
        const result = await response.json();
        return result.data || [];
    },

    attachModifiersToItem: async (itemId: string, modifierGroupIds: string[]): Promise<void> => {
        // Không cần gọi API nếu không có modifier nào được chọn
        // Backend sẽ xóa tất cả modifiers cũ, đây là hành vi mong muốn
        const response = await fetch(`${API_BASE}/admin/menu/modifier-groups/items/${itemId}/modifiers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-restaurant-id': MOCK_RESTAURANT_ID
            },
            body: JSON.stringify({ modifier_group_ids: modifierGroupIds })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to attach modifiers');
        }
    },
};