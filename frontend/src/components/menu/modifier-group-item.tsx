import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus } from "lucide-react"
import { ModifierGroup } from "@/types/menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ModifierOptionItem } from "./modifier-option-item"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ModifierGroupItemProps {
  group: ModifierGroup
  onUpdate: (id: string, updates: Partial<ModifierGroup>) => void
  onDelete: (id: string) => void
  onUpdateOption: (groupId: string, optionId: string, updates: Partial<ModifierGroup["options"][0]>) => void
  onDeleteOption: (groupId: string, optionId: string) => void
  onAddOption: (groupId: string) => void
}

export function ModifierGroupItem({
  group,
  onUpdate,
  onDelete,
  onUpdateOption,
  onDeleteOption,
  onAddOption,
}: ModifierGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

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
      className="group rounded-lg border bg-card"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 space-y-3">
            <div>
              <Label htmlFor={`group-name-${group.id}`} className="text-xs">
                Group Name
              </Label>
              <Input
                id={`group-name-${group.id}`}
                value={group.name}
                onChange={(e) => onUpdate(group.id, { name: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`group-min-${group.id}`} className="text-xs">
                  Min Selections
                </Label>
                <Input
                  id={`group-min-${group.id}`}
                  type="number"
                  min="0"
                  value={group.minSelections}
                  onChange={(e) =>
                    onUpdate(group.id, {
                      minSelections: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor={`group-max-${group.id}`} className="text-xs">
                  Max Selections
                </Label>
                <Input
                  id={`group-max-${group.id}`}
                  type="number"
                  min="1"
                  value={group.maxSelections}
                  onChange={(e) =>
                    onUpdate(group.id, {
                      maxSelections: parseInt(e.target.value) || 1,
                    })
                  }
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`group-required-${group.id}`}
                    checked={group.isRequired}
                    onCheckedChange={(checked) =>
                      onUpdate(group.id, { isRequired: checked })
                    }
                  />
                  <Label htmlFor={`group-required-${group.id}`} className="text-sm">
                    Required
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onDelete(group.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Options</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddOption(group.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <ModifierOptionItem
                      key={option.id}
                      option={option}
                      onUpdate={(id, updates) =>
                        onUpdateOption(group.id, id, updates)
                      }
                      onDelete={(id) => onDeleteOption(group.id, id)}
                    />
                  ))}
                  {group.options.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No options yet. Add one to get started.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

