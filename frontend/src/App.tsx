import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { MenuGrid } from "@/components/menu/menu-grid"
import { EditItemDrawer } from "@/components/menu/edit-item-drawer"
import { QuickEditPriceDialog } from "@/components/menu/quick-edit-price-dialog"
import { useMenuItems, useMenuHealth, useUpdateMenuItem } from "@/hooks/use-menu-query"
import { MenuItem } from "@/types/menu"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const { data: items = [], isLoading } = useMenuItems()
  const { data: menuHealth } = useMenuHealth()
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col ml-64">
        <TopBar menuHealth={menuHealth || null} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
          <MenuGrid
            items={items}
            isLoading={isLoading}
            onEditItem={handleEditItem}
            onQuickEditPrice={handleQuickEditPrice}
          />
        </main>
      </div>

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App

