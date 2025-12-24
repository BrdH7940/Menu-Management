import { useMemo } from "react"
import { VirtuosoGrid } from "react-virtuoso"
import { MenuItem } from "@/types/menu"
import { MenuItemCard } from "./menu-item-card"
import { Skeleton } from "@/components/ui/skeleton"

interface MenuGridProps {
  items: MenuItem[]
  isLoading?: boolean
  onEditItem: (item: MenuItem) => void
  onQuickEditPrice: (item: MenuItem) => void
}

function MenuGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function MenuGrid({ items, isLoading, onEditItem, onQuickEditPrice }: MenuGridProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Sort by availability first, then by display order
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1
      }
      return a.displayOrder - b.displayOrder
    })
  }, [items])

  if (isLoading) {
    return <MenuGridSkeleton />
  }

  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">No menu items found</p>
      </div>
    )
  }

  // Use virtual scrolling for large lists (50+ items), regular grid for smaller lists
  const useVirtualScrolling = sortedItems.length > 50

  if (useVirtualScrolling) {
    return (
      <div className="h-[calc(100vh-12rem)] w-full">
        <VirtuosoGrid
          totalCount={sortedItems.length}
          itemContent={(index) => {
            const item = sortedItems[index]
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={onEditItem}
                onQuickEditPrice={onQuickEditPrice}
              />
            )
          }}
          style={{ height: "100%", width: "100%" }}
          listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedItems.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={onEditItem}
          onQuickEditPrice={onQuickEditPrice}
        />
      ))}
    </div>
  )
}

