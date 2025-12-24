import { AlertCircle, CheckCircle2, ImageOff, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MenuHealth } from "@/types/menu"

interface TopBarProps {
  menuHealth: MenuHealth | null
  className?: string
}

export function TopBar({ menuHealth, className }: TopBarProps) {
  if (!menuHealth) {
    return (
      <header className={`h-16 border-b bg-white/80 backdrop-blur-sm ${className || ""}`}>
        <div className="flex h-full items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`h-16 border-b bg-white/80 backdrop-blur-sm ${className || ""}`}>
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-semibold">Menu Management</h1>
        </div>
        <div className="flex items-center gap-4">
          {menuHealth.soldOutItems > 0 && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertCircle className="h-3 w-3" />
              {menuHealth.soldOutItems} Sold Out
            </Badge>
          )}
          {menuHealth.itemsWithoutImage > 0 && (
            <Badge variant="warning" className="gap-1.5">
              <ImageOff className="h-3 w-3" />
              {menuHealth.itemsWithoutImage} No Image
            </Badge>
          )}
          {menuHealth.itemsWithoutDescription > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <FileText className="h-3 w-3" />
              {menuHealth.itemsWithoutDescription} No Desc
            </Badge>
          )}
          {menuHealth.soldOutItems === 0 &&
            menuHealth.itemsWithoutImage === 0 &&
            menuHealth.itemsWithoutDescription === 0 && (
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                All Good
              </Badge>
            )}
        </div>
      </div>
    </header>
  )
}

