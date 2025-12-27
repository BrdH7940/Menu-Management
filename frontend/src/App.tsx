import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { useMenuHealth } from "@/hooks/use-menu-query"
import { Dashboard } from "@/pages/dashboard"
import { MenuItems } from "@/pages/menu-items"
import { Categories } from "@/pages/categories"
import { Analytics } from "@/pages/analytics"
import { SettingsPage } from "@/pages/settings"
import { GuestMenuPage } from "@/pages/guest-menu"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

function AppContent() {
    const { data: menuHealth } = useMenuHealth()

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col ml-64">
                <TopBar menuHealth={menuHealth || null} />
                <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/menu-items" element={<MenuItems />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/guest-menu" element={<GuestMenuPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App

