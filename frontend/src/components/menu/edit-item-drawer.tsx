import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { MenuItem, ModifierGroup } from "@/types/menu"
import { useMenuItem } from "@/hooks/use-menu-query"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ModifierGroupItem } from "./modifier-group-item"
import { PhotoManager } from "./photo-manager"
import { Plus } from "lucide-react"

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  isAvailable: z.boolean(),
})

type MenuItemFormData = z.infer<typeof menuItemSchema>

interface EditItemDrawerProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: MenuItem) => Promise<void>
}

export function EditItemDrawer({
  item,
  open,
  onOpenChange,
  onSave,
}: EditItemDrawerProps) {
  const [activeTab, setActiveTab] = useState("general")
  const { data: fullItem, isLoading } = useMenuItem(item?.id || "", { enabled: !!item?.id && open })
  const selectedItem = fullItem || item
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(
    selectedItem?.modifierGroups || []
  )

  // Update modifierGroups when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setModifierGroups(selectedItem.modifierGroups || [])
    }
  }, [selectedItem])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: selectedItem?.name || "",
      description: selectedItem?.description || "",
      price: selectedItem?.price || 0,
      isAvailable: (selectedItem?.status === "available" || selectedItem?.isAvailable) ?? true,
    },
  })

  // Update form when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      const isAvailable = selectedItem.status === 'available' || selectedItem.isAvailable === true;
      reset({
        name: selectedItem.name,
        description: selectedItem.description || "",
        price: selectedItem.price,
        isAvailable,
      })
      setModifierGroups(selectedItem.modifierGroups || [])
      setActiveTab("general") // Reset to first tab when item changes
    }
  }, [selectedItem, reset])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const onSubmit = async (data: MenuItemFormData) => {
    if (!selectedItem) return

    const updatedItem: MenuItem = {
      ...selectedItem,
      ...data,
      modifierGroups,
      photos: selectedItem.photos,
    }

    await onSave(updatedItem)
    onOpenChange(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setModifierGroups((groups) => {
        const oldIndex = groups.findIndex((g) => g.id === active.id)
        const newIndex = groups.findIndex((g) => g.id === over.id)
        return arrayMove(groups, oldIndex, newIndex).map((group, index) => ({
          ...group,
          displayOrder: index,
        }))
      })
    }
  }

  const handleUpdateGroup = (id: string, updates: Partial<ModifierGroup>) => {
    setModifierGroups((groups) =>
      groups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      )
    )
  }

  const handleDeleteGroup = (id: string) => {
    setModifierGroups((groups) => groups.filter((group) => group.id !== id))
  }

  const handleUpdateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<ModifierGroup["options"][0]>
  ) => {
    setModifierGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((opt) =>
                opt.id === optionId ? { ...opt, ...updates } : opt
              ),
            }
          : group
      )
    )
  }

  const handleDeleteOption = (groupId: string, optionId: string) => {
    setModifierGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.filter((opt) => opt.id !== optionId),
            }
          : group
      )
    )
  }

  const handleAddOption = (groupId: string) => {
    setModifierGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [
                ...group.options,
                {
                  id: `opt-${Date.now()}`,
                  name: "New Option",
                  price: 0,
                  isDefault: false,
                  displayOrder: group.options.length,
                },
              ],
            }
          : group
      )
    )
  }

  const handleAddGroup = () => {
    setModifierGroups([
      ...modifierGroups,
      {
        id: `group-${Date.now()}`,
        name: "New Modifier Group",
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        displayOrder: modifierGroups.length,
        options: [],
      },
    ])
  }

  if (!selectedItem && !isLoading) return null

  const isAvailable = watch("isAvailable")

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>
              {isLoading ? "Loading..." : "Edit Menu Item"}
            </DrawerTitle>
          </DrawerHeader>

          <DrawerBody className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isAvailable">Availability</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this item available for ordering
                    </p>
                  </div>
                  <Switch
                    id="isAvailable"
                    checked={isAvailable}
                    onCheckedChange={(checked) => setValue("isAvailable", checked)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="modifiers" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Modifier Groups</h3>
                    <p className="text-sm text-muted-foreground">
                      Add options like sizes, toppings, or add-ons
                    </p>
                  </div>
                  <Button type="button" onClick={handleAddGroup}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Group
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={modifierGroups.map((g) => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {modifierGroups.map((group) => (
                        <ModifierGroupItem
                          key={group.id}
                          group={group}
                          onUpdate={handleUpdateGroup}
                          onDelete={handleDeleteGroup}
                          onUpdateOption={handleUpdateOption}
                          onDeleteOption={handleDeleteOption}
                          onAddOption={handleAddOption}
                        />
                      ))}
                      {modifierGroups.length === 0 && (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            No modifier groups yet. Add one to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-4">
                {selectedItem && (
                  <PhotoManager
                    itemId={selectedItem.id}
                    photos={selectedItem.photos || []}
                    onPhotosChange={(photos) => {
                      // Photos are updated via API, so we just need to refresh
                      // The parent component should refetch the item
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </DrawerBody>

          <DrawerFooter>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

