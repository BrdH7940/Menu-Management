import { MenuItem } from "@/types/menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatPriceVND } from "@/lib/api"
import { useState } from "react"
import { Check, Circle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface GuestItemDialogProps {
    item: MenuItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function GuestItemDialog({ item, open, onOpenChange }: GuestItemDialogProps) {
    const [selections, setSelections] = useState<Record<string, string[]>>({});

    if (!item) return null;

    // Tính toán tổng giá: Base Price + Sum of selected modifiers
    const calculateTotal = () => {
        if (!item) return 0;
        let extra = 0;

        item.modifierGroups?.forEach(group => {
            const selectedIds = selections[group.id] || [];
            group.options.forEach(opt => {
                if (selectedIds.includes(opt.id)) {
                    extra += opt.price;
                }
            });
        });
        return item.price + extra;
    };

    // Handle single selection (radio)
    const handleSingleSelect = (groupId: string, optionId: string) => {
        setSelections(prev => ({ ...prev, [groupId]: [optionId] }));
    };

    // Handle multiple selection (checkbox)
    const handleMultiSelect = (groupId: string, optionId: string, checked: boolean) => {
        const current = selections[groupId] || [];
        setSelections(prev => ({
            ...prev,
            [groupId]: checked
                ? [...current, optionId]
                : current.filter(id => id !== optionId)
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                    {item.modifierGroups?.map(group => {
                        const isRequired = group.isRequired;
                        const isSingle = group.selectionType === 'single';

                        return (
                            <div key={group.id} className="space-y-3">
                                {/* Group Header */}
                                <div className="flex justify-between items-center">
                                    <Label className="font-bold text-base">{group.name}</Label>
                                    {isRequired && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            Bắt buộc
                                        </span>
                                    )}
                                </div>

                                {/* Options */}
                                <div className="space-y-2">
                                    {group.options.map(opt => {
                                        const isSelected = (selections[group.id] || []).includes(opt.id);

                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isSingle) {
                                                        handleSingleSelect(group.id, opt.id);
                                                    } else {
                                                        handleMultiSelect(group.id, opt.id, !isSelected);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Custom Radio/Checkbox Indicator */}
                                                    {isSingle ? (
                                                        // Radio Style
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                            isSelected
                                                                ? "border-primary bg-primary"
                                                                : "border-gray-300"
                                                        )}>
                                                            {isSelected && (
                                                                <Circle className="h-2.5 w-2.5 fill-white text-white" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Checkbox Style
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                            isSelected
                                                                ? "border-primary bg-primary"
                                                                : "border-gray-300"
                                                        )}>
                                                            {isSelected && (
                                                                <Check className="h-3.5 w-3.5 text-white" />
                                                            )}
                                                        </div>
                                                    )}

                                                    <Label
                                                        htmlFor={opt.id}
                                                        className="font-medium cursor-pointer"
                                                    >
                                                        {opt.name}
                                                    </Label>
                                                </div>

                                                {/* Price */}
                                                {opt.price > 0 && (
                                                    <span className="text-sm font-semibold text-primary">
                                                        +{formatPriceVND(opt.price)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {(!item.modifierGroups || item.modifierGroups.length === 0) && (
                        <p className="text-center text-muted-foreground text-sm py-8">
                            Món này không có tùy chọn thêm
                        </p>
                    )}
                </div>

                <DialogFooter className="flex-row items-center justify-between gap-4">
                    <div className="text-left">
                        <p className="text-xs text-muted-foreground">Tổng cộng</p>
                        <p className="text-xl font-bold text-primary">
                            {formatPriceVND(calculateTotal())}
                        </p>
                    </div>
                    <Button className="flex-1">Thêm vào giỏ hàng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}