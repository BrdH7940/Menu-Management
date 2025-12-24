import { Menu, Home, Settings, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-full w-64 border-r bg-white/80 backdrop-blur-sm shadow-sm",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <Menu className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Menu Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Menu className="h-4 w-4" />
            Menu Items
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </nav>
      </div>
    </aside>
  )
}

