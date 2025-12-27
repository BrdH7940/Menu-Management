// hooks/use-guest-menu.ts

import { useQuery } from "@tanstack/react-query";
import { guestMenuApi } from "@/lib/guest-menu-api";
import { GuestMenuResponse, GuestMenuFilters } from "@/types/guest-menu";

/**
 * Hook lấy Menu dành cho Khách hàng
 * Áp dụng quy tắc: Chỉ hiển thị món Available & Category Active
 */
export function useGuestMenu(filters?: GuestMenuFilters) {
    return useQuery<GuestMenuResponse>({
        queryKey: ["guest-menu", filters],
        queryFn: () => guestMenuApi.getGuestMenu(filters),
        staleTime: 1 * 60 * 1000, // 1 phút (Menu khách cần cập nhật nhanh)
    });
}

/**
 * Hook lấy chi tiết món ăn (bao gồm modifiers)
 */
export function useGuestMenuItem(itemId: string, enabled = true) {
    return useQuery({
        queryKey: ["guest-menu-item", itemId],
        queryFn: () => guestMenuApi.getMenuItem(itemId),
        enabled: !!itemId && enabled,
        staleTime: 5 * 60 * 1000,
    });
}
