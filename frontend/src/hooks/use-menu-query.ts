import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { menuApi } from '@/lib/api'
import { MenuItem, MenuCategory, MenuHealth, MenuItemListResponse, MenuItemFilters } from "@/types/menu"

export function useMenuItems(filters?: MenuItemFilters) {
    return useQuery<MenuItemListResponse>({
        queryKey: ["menu-items", filters],
        queryFn: () => menuApi.getItems(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export function useMenuItem(id: string, options?: { enabled?: boolean }) {
    return useQuery<MenuItem>({
        queryKey: ["menu-items", id],
        queryFn: () => menuApi.getItem(id),
        enabled: !!id && (options?.enabled !== false),
    })
}

export function useMenuHealth() {
    return useQuery<MenuHealth>({
        queryKey: ["menu-health"],
        queryFn: () => menuApi.getMenuHealth(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

export function useUpdateMenuItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<MenuItem> }) => {
            // 1. Cập nhật thông tin cơ bản của Item
            const updatedItem = await menuApi.updateItem(id, data);

            // 2. Nếu có gửi kèm modifierGroups, thực hiện logic đồng bộ (mapping theo yêu cầu hình ảnh)
            if (data.modifierGroups) {
                const groupIds = data.modifierGroups.map(g => g.id);
                await menuApi.attachModifierGroups(id, groupIds);
            }

            return updatedItem;
        },
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["menu-items"] })

            // Snapshot previous value
            const previousItems = queryClient.getQueryData<MenuItem[]>(["menu-items"])

            // Optimistically update
            if (previousItems) {
                queryClient.setQueryData<MenuItem[]>(
                    ["menu-items"],
                    previousItems.map((item) =>
                        item.id === id ? { ...item, ...data } : item
                    )
                )
            }

            // Also update single item cache
            const previousItem = queryClient.getQueryData<MenuItem>([
                "menu-items",
                id,
            ])
            if (previousItem) {
                queryClient.setQueryData<MenuItem>(["menu-items", id], {
                    ...previousItem,
                    ...data,
                })
            }

            // Invalidate health stats
            queryClient.invalidateQueries({ queryKey: ["menu-health"] })

            return { previousItems, previousItem }
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousItems) {
                queryClient.setQueryData(["menu-items"], context.previousItems)
            }
            if (context?.previousItem) {
                queryClient.setQueryData(
                    ["menu-items", variables.id],
                    context.previousItem
                )
            }
        },
        onSettled: (data, error, variables) => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["menu-items"] })
            queryClient.invalidateQueries({ queryKey: ["menu-items", variables.id] })
            queryClient.invalidateQueries({ queryKey: ["menu-health"] })
        },
    })
}

// Create menu item hook
export function useCreateMenuItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) =>
            menuApi.createItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items"] })
            queryClient.invalidateQueries({ queryKey: ["menu-health"] })
        },
    })
}

// Delete (soft) menu item hook
export function useDeleteMenuItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => menuApi.deleteItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items"] })
            queryClient.invalidateQueries({ queryKey: ["menu-health"] })
        },
    })
}

// Categories hooks
export function useCategories() {
    return useQuery<MenuCategory[]>({
        queryKey: ["categories"],
        queryFn: () => menuApi.getCategories(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export function useCreateCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { name: string; description?: string; display_order?: number }) =>
            menuApi.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        },
    })
}

export function useUpdateCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MenuCategory> }) =>
            menuApi.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        },
    })
}

export function useDeleteCategory() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => menuApi.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        },
    })
}

// Hook lấy danh sách Category đang Active cho Guest
export function useGuestCategories() {
    return useQuery<MenuCategory[]>({
        queryKey: ["categories", "guest"],
        queryFn: async () => {
            const categories = await menuApi.getCategories();
            // Quy tắc hiển thị: Chỉ lấy category Active
            return categories.filter(cat => cat.status === 'active' && !cat.is_deleted);
        },
        staleTime: 10 * 60 * 1000,
    });
}
