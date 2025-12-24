import { useState, useEffect } from "react"
import { MenuItem } from "@/types/menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface QuickEditPriceDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: MenuItem, newPrice: number) => Promise<void>
}

export function QuickEditPriceDialog({
  item,
  open,
  onOpenChange,
  onSave,
}: QuickEditPriceDialogProps) {
  const [price, setPrice] = useState<string>("")

  useEffect(() => {
    if (item) {
      setPrice(item.price.toFixed(2))
    }
  }, [item])

  const handleSave = async () => {
    if (!item) return
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) return
    await onSave(item, numPrice)
    onOpenChange(false)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Edit Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{item.name}</p>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave()
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

