import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { menuApi } from "@/lib/api"
import { MenuItem, MenuHealth } from "@/types/menu"

export function useMenuItems() {
  return useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: () => menuApi.getItems(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useMenuItem(id: string) {
  return useQuery<MenuItem>({
    queryKey: ["menu-items", id],
    queryFn: () => menuApi.getItem(id),
    enabled: !!id,
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
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      menuApi.updateItem(id, data),
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

