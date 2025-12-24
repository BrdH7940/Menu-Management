import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import { ModifierOption } from "@/types/menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"

interface ModifierOptionItemProps {
  option: ModifierOption
  onUpdate: (id: string, updates: Partial<ModifierOption>) => void
  onDelete: (id: string) => void
}

export function ModifierOptionItem({
  option,
  onUpdate,
  onDelete,
}: ModifierOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="group flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div>
          <Label htmlFor={`option-name-${option.id}`} className="text-xs">
            Option Name
          </Label>
          <Input
            id={`option-name-${option.id}`}
            value={option.name}
            onChange={(e) => onUpdate(option.id, { name: e.target.value })}
            className="h-9"
          />
        </div>
        <div>
          <Label htmlFor={`option-price-${option.id}`} className="text-xs">
            Price Adjustment
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              id={`option-price-${option.id}`}
              type="number"
              step="0.01"
              value={option.price}
              onChange={(e) =>
                onUpdate(option.id, { price: parseFloat(e.target.value) || 0 })
              }
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Default Switch */}
      <div className="flex flex-col items-center gap-2">
        <Label htmlFor={`option-default-${option.id}`} className="text-xs">
          Default
        </Label>
        <Switch
          id={`option-default-${option.id}`}
          checked={option.isDefault}
          onCheckedChange={(checked) =>
            onUpdate(option.id, { isDefault: checked })
          }
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onDelete(option.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

