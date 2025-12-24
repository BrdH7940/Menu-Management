import { useState } from "react"
import { Menu } from "lucide-react"
import { MenuGrid } from "@/components/menu/menu-grid"
import { EditItemDrawer } from "@/components/menu/edit-item-drawer"
import { QuickEditPriceDialog } from "@/components/menu/quick-edit-price-dialog"
import { useMenuItems, useUpdateMenuItem } from "@/hooks/use-menu-query"
import { MenuItem } from "@/types/menu"

export function MenuItems() {
  const { data: items = [], isLoading } = useMenuItems()
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
    await updateMutation.mutateAsync({
      id: item.id,
      data: item,
    })
  }

  const handleQuickSavePrice = async (item: MenuItem, newPrice: number) => {
    await updateMutation.mutateAsync({
      id: item.id,
      data: { price: newPrice },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Menu className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Menu Items</h1>
      </div>
      <MenuGrid
        items={items}
        isLoading={isLoading}
        onEditItem={handleEditItem}
        onQuickEditPrice={handleQuickEditPrice}
      />

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

