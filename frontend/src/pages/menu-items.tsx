import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Menu, Plus, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MenuGrid } from "@/components/menu/menu-grid"
import { CreateEditItemDialog } from "@/components/menu/create-edit-item-dialog"
import { ModifierGroupsManagementDialog } from "@/components/menu/modifier-groups-management-dialog"
import { DeleteItemDialog } from "@/components/menu/delete-item-dialog"
import { FilterBar } from "@/components/menu/filter-bar"
import { SortBar } from "@/components/menu/sort-bar"
import { Pagination } from "@/components/menu/pagination"
import { useMenuItems } from "@/hooks/use-menu-query"
import { MenuItem, MenuItemFilters } from "@/types/menu"

export function MenuItems() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [isModifierGroupsOpen, setIsModifierGroupsOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const getFiltersFromParams = (): MenuItemFilters => ({
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "20"),
        q: searchParams.get("q") || undefined,
        categoryId: searchParams.get("categoryId") || undefined,
        status: (searchParams.get("status") as any) || undefined,
    })

    const [filters, setFilters] = useState<MenuItemFilters>(getFiltersFromParams())
    const { data, isLoading, refetch } = useMenuItems(filters)

    useEffect(() => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, String(value))
        })
        setSearchParams(params, { replace: true })
    }, [filters])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Menu className="h-6 w-6 text-primary" />
                    <h1 className="text-3xl font-bold">Quản lý Món ăn</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsModifierGroupsOpen(true)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Quản lý Modifiers
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm món ăn
                    </Button>
                </div>
            </div>

            <FilterBar filters={filters} onFiltersChange={setFilters} />

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Tổng cộng: {data?.pagination.total || 0} món
                </div>
                <SortBar filters={filters} onFiltersChange={setFilters} />
            </div>

            <MenuGrid
                items={data?.items || []}
                isLoading={isLoading}
                onEditItem={(item) => { setEditingItem(item); setIsEditDialogOpen(true); }}
                onDeleteItem={(item) => { setDeleteItem(item); setIsDeleteDialogOpen(true); }}
            />

            {data?.pagination && data.pagination.totalPages > 1 && (
                <Pagination
                    page={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={(page) => setFilters({ ...filters, page })}
                />
            )}

            {/* Dialog Quản lý Modifier tập trung */}
            <ModifierGroupsManagementDialog
                open={isModifierGroupsOpen}
                onOpenChange={setIsModifierGroupsOpen}
            />

            <CreateEditItemDialog
                open={isCreateDialogOpen || isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) { setIsEditDialogOpen(false); setEditingItem(null); }
                }}
                item={editingItem}
                onSuccess={refetch}
            />

            <DeleteItemDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                item={deleteItem}
                onSuccess={refetch}
            />
        </div>
    )
}