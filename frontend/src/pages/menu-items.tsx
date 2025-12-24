import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Menu } from "lucide-react"
import { MenuGrid } from "@/components/menu/menu-grid"
import { EditItemDrawer } from "@/components/menu/edit-item-drawer"
import { QuickEditPriceDialog } from "@/components/menu/quick-edit-price-dialog"
import { FilterBar } from "@/components/menu/filter-bar"
import { SortBar } from "@/components/menu/sort-bar"
import { Pagination } from "@/components/menu/pagination"
import { useMenuItems, useUpdateMenuItem } from "@/hooks/use-menu-query"
import { MenuItem, MenuItemFilters } from "@/types/menu"

export function MenuItems() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Initialize filters from URL params
  const getFiltersFromParams = (): MenuItemFilters => {
    return {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      q: searchParams.get("q") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      sort: (searchParams.get("sort") as any) || "created_at",
      order: (searchParams.get("order") as any) || "desc",
    }
  }

  const [filters, setFilters] = useState<MenuItemFilters>(getFiltersFromParams())
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value))
      }
    })
    setSearchParams(params, { replace: true })
  }, [filters, setSearchParams])

  // Update filters when URL params change (e.g., browser back/forward)
  useEffect(() => {
    setFilters(getFiltersFromParams())
  }, [searchParams])

  const { data, isLoading } = useMenuItems(filters)
  const updateMutation = useUpdateMenuItem()

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [quickEditItem, setQuickEditItem] = useState<MenuItem | null>(null)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item)
    setIsDrawerOpen(true)
  }

  const handleQuickEditPrice = (item: MenuItem) => {
    setQuickEditItem(item)
    setIsQuickEditOpen(true)
  }

  const handleSaveItem = async (item: MenuItem) => {
    const { photos, modifierGroups, ...updateData } = item;
    await updateMutation.mutateAsync({
      id: item.id,
      data: updateData,
    })
    setIsDrawerOpen(false)
  }

  const handleQuickSavePrice = async (item: MenuItem, newPrice: number) => {
    await updateMutation.mutateAsync({
      id: item.id,
      data: { price: newPrice },
    })
    setIsQuickEditOpen(false)
  }

  const handleFiltersChange = (newFilters: MenuItemFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Menu className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Menu Items</h1>
      </div>

      <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data?.pagination.total ? (
            <>
              Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{" "}
              {Math.min((filters.page || 1) * (filters.limit || 20), data.pagination.total)} of{" "}
              {data.pagination.total} items
            </>
          ) : (
            "No items found"
          )}
        </div>
        <SortBar filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      <MenuGrid
        items={data?.items || []}
        isLoading={isLoading}
        onEditItem={handleEditItem}
        onQuickEditPrice={handleQuickEditPrice}
      />

      {data?.pagination && data.pagination.totalPages > 1 && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <EditItemDrawer
        item={selectedItem}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSave={handleSaveItem}
      />

      <QuickEditPriceDialog
        item={quickEditItem}
        open={isQuickEditOpen}
        onOpenChange={setIsQuickEditOpen}
        onSave={handleQuickSavePrice}
      />
    </div>
  )
}

