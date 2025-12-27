import { GuestMenuResponse, GuestMenuFilters, GuestMenuItem } from '@/types/guest-menu';

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

export const guestMenuApi = {
    /**
     * Lấy Menu dành cho Khách hàng (Guest)
     * FIX: Sử dụng endpoint /api/menu thay vì /api/admin/menu/items
     */
    getGuestMenu: async (filters?: GuestMenuFilters): Promise<GuestMenuResponse> => {
        const backendParams: Record<string, any> = {};

        if (filters) {
            if (filters.q) backendParams.search = filters.q;
            if (filters.categoryId) backendParams.category_id = filters.categoryId;
            if (filters.sortBy) backendParams.sort_by = filters.sortBy;
            if (filters.order) backendParams.order = filters.order;
            if (filters.isChefRecommended) backendParams.is_chef_recommended = true;
        }

        const queryString = buildQueryString(backendParams);

        // FIX: Gọi endpoint public menu
        const response = await fetch(`${API_BASE}/menu${queryString ? '?' + queryString : ''}`, {
            headers: {
                'x-restaurant-id': MOCK_RESTAURANT_ID,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch guest menu');
        }

        const result = await response.json();

        // FIX: Map đúng cấu trúc response từ backend
        return {
            restaurant_name: result.data?.restaurant_name || "Smart Restaurant",
            categories: (result.data?.categories || [])
                .filter((cat: any) => cat.status === 'active')
                .map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    status: 'active',
                    displayOrder: cat.display_order,
                    items: (cat.items || [])
                        .filter((item: any) => item.status === 'available')
                        .map((item: any) => ({
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            categoryId: item.category_id,
                            categoryName: cat.name,
                            status: 'available',
                            prepTimeMinutes: item.prep_time_minutes,
                            isChefRecommended: item.is_chef_recommended,
                            displayOrder: item.display_order,
                            primaryPhotoUrl: item.primary_photo_url || item.photos?.[0]?.url,
                            // FIX: Map modifier_groups từ backend
                            modifierGroups: (item.modifier_groups || []).map((group: any) => ({
                                id: group.id,
                                name: group.name,
                                description: group.description,
                                isRequired: group.is_required,
                                minSelections: group.min_selections,
                                maxSelections: group.max_selections,
                                selectionType: group.selection_type,
                                displayOrder: group.display_order,
                                status: group.status,
                                options: (group.options || []).map((opt: any) => ({
                                    id: opt.id,
                                    name: opt.name,
                                    price: opt.price_adjustment || opt.price || 0,
                                    isDefault: opt.is_default || false,
                                    displayOrder: opt.display_order || 0,
                                })),
                            })),
                        })),
                })),
        };
    },

    /**
     * Lấy chi tiết món ăn (bao gồm modifier groups)
     * FIX: Sử dụng endpoint public và map đúng cấu trúc
     */
    getMenuItem: async (itemId: string): Promise<GuestMenuItem> => {
        const response = await fetch(`${API_BASE}/menu/items/${itemId}`, {
            headers: {
                'x-restaurant-id': MOCK_RESTAURANT_ID,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch menu item');
        }

        const result = await response.json();
        const item = result.data;

        return {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            categoryId: item.category_id,
            categoryName: item.category_name,
            status: item.status,
            prepTimeMinutes: item.prep_time_minutes,
            isChefRecommended: item.is_chef_recommended,
            primaryPhotoUrl: item.primary_photo_url || item.photos?.[0]?.url,
            modifierGroups: (item.modifier_groups || []).map((group: any) => ({
                id: group.id,
                name: group.name,
                description: group.description,
                isRequired: group.is_required,
                minSelections: group.min_selections,
                maxSelections: group.max_selections,
                selectionType: group.selection_type,
                displayOrder: group.display_order,
                status: group.status,
                options: (group.options || []).map((opt: any) => ({
                    id: opt.id,
                    name: opt.name,
                    price: opt.price_adjustment || opt.price || 0,
                    isDefault: opt.is_default || false,
                    displayOrder: opt.display_order || 0,
                })),
            })),
        };
    },

    /**
     * Tính tổng giá cho món ăn với các modifier đã chọn
     */
    calculateItemTotal: (
        basePrice: number,
        modifierGroups: Array<{ id: string; options: Array<{ id: string; price: number }> }>,
        selections: Record<string, string[]>
    ): number => {
        let total = basePrice;

        modifierGroups.forEach(group => {
            const selectedIds = selections[group.id] || [];
            selectedIds.forEach(optId => {
                const option = group.options.find(o => o.id === optId);
                if (option) {
                    total += option.price;
                }
            });
        });

        return total;
    },

    /**
     * Validate selections theo quy tắc của modifier groups
     */
    validateSelections: (
        modifierGroups: Array<{
            id: string;
            isRequired: boolean;
            minSelections: number;
            maxSelections: number;
        }>,
        selections: Record<string, string[]>
    ): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        modifierGroups.forEach(group => {
            const selected = selections[group.id] || [];

            if (group.isRequired && selected.length === 0) {
                errors.push(`Vui lòng chọn tùy chọn bắt buộc`);
            }

            if (selected.length < group.minSelections) {
                errors.push(`Cần chọn ít nhất ${group.minSelections} tùy chọn`);
            }

            if (selected.length > group.maxSelections) {
                errors.push(`Chỉ được chọn tối đa ${group.maxSelections} tùy chọn`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
        };
    },
};