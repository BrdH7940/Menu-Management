import { useState, useEffect } from "react"
import { Check, Plus, Settings } from "lucide-react"
import { ModifierGroup } from "@/types/menu"
import { menuApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface ModifierGroupSelectorProps {
    itemId?: string; // Thêm itemId để load dữ liệu đã liên kết
    selectedGroupIds: string[]
    onSelectionChange: (groupIds: string[]) => void
}

export function ModifierGroupSelector({
    itemId,
    selectedGroupIds,
    onSelectionChange,
}: ModifierGroupSelectorProps) {
    const [availableGroups, setAvailableGroups] = useState<ModifierGroup[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showManageDialog, setShowManageDialog] = useState(false)

    // Effect khởi tạo dữ liệu
    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true)
            try {
                // 1. Load tất cả groups đang có hiệu lực (active)
                const groups = await menuApi.getModifierGroups()
                const activeGroups = groups.filter(g => g.status === 'active')
                setAvailableGroups(activeGroups)

                // 2. Nếu có itemId, load thông tin món ăn để xem group nào đã được link
                if (itemId) {
                    const itemData = await menuApi.getItem(itemId)
                    if (itemData.modifierGroups && itemData.modifierGroups.length > 0) {
                        const linkedIds = itemData.modifierGroups.map(g => g.id)
                        onSelectionChange(linkedIds)
                    }
                }
            } catch (error: any) {
                console.error("Lỗi khi khởi tạo dữ liệu Modifier Groups:", error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeData()
        // Lưu ý: Chỉ chạy lại khi itemId thay đổi để tránh vòng lặp vô tận với onSelectionChange
    }, [itemId])

    const handleToggleGroup = (groupId: string) => {
        const isSelected = selectedGroupIds.includes(groupId)
        if (isSelected) {
            onSelectionChange(selectedGroupIds.filter(id => id !== groupId))
        } else {
            onSelectionChange([...selectedGroupIds, groupId])
        }
    }

    const handleSelectAll = () => {
        onSelectionChange(availableGroups.map(g => g.id))
    }

    const handleDeselectAll = () => {
        onSelectionChange([])
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Modifier Groups</h3>
                    <p className="text-sm text-muted-foreground">
                        Chọn các nhóm tùy chọn áp dụng cho món ăn này
                    </p>
                </div>

                <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Quản lý Groups
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Quản lý Modifier Groups</DialogTitle>
                            <DialogDescription>
                                Tạo và quản lý các nhóm tùy chọn cho menu
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Chức năng quản lý nâng cao sẽ được thêm vào sau
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Đang tải dữ liệu tùy chọn...
                </div>
            ) : availableGroups.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">
                        Chưa có modifier group nào khả dụng
                    </p>
                    <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo modifier group đầu tiên
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={selectedGroupIds.length === availableGroups.length}
                        >
                            Chọn tất cả
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAll}
                            disabled={selectedGroupIds.length === 0}
                        >
                            Bỏ chọn tất cả
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-card">
                        {availableGroups.map((group) => {
                            const isSelected = selectedGroupIds.includes(group.id)

                            return (
                                <div
                                    key={group.id}
                                    className={`
                                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                                        transition-all hover:bg-accent/50
                                        ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                                    `}
                                    onClick={() => handleToggleGroup(group.id)}
                                >
                                    <Checkbox
                                        id={`group-${group.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() => handleToggleGroup(group.id)}
                                        className="mt-1"
                                    />

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Label
                                                htmlFor={`group-${group.id}`}
                                                className="font-medium cursor-pointer"
                                            >
                                                {group.name}
                                            </Label>
                                            {group.isRequired && (
                                                <span className="text-[10px] bg-destructive/10 text-destructive font-bold px-1.5 py-0.5 rounded uppercase">
                                                    Bắt buộc
                                                </span>
                                            )}
                                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded uppercase">
                                                {group.selectionType === 'single' ? 'Chọn 1' : 'Chọn nhiều'}
                                            </span>
                                        </div>

                                        {group.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {group.description}
                                            </p>
                                        )}

                                        <p className="text-xs text-muted-foreground font-medium">
                                            {group.options.length} tùy chọn • Quy tắc: {group.minSelections}-{group.maxSelections}
                                        </p>

                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {group.options.slice(0, 4).map((opt) => (
                                                <span
                                                    key={opt.id}
                                                    className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border"
                                                >
                                                    {opt.name} {opt.price > 0 && `(+${opt.price.toLocaleString()}đ)`}
                                                </span>
                                            ))}
                                            {group.options.length > 4 && (
                                                <span className="text-[11px] text-muted-foreground px-1 py-0.5">
                                                    +{group.options.length - 4} khác...
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {selectedGroupIds.length > 0 && (
                <div className="text-sm font-medium text-primary">
                    Đang áp dụng: {selectedGroupIds.length} nhóm tùy chọn
                </div>
            )}
        </div>
    )
}