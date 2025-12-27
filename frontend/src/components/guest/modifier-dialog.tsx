// components/guest/modifier-dialog.tsx

import { useState, useEffect } from "react";
import { X, Check, Plus, Minus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GuestMenuItem } from "@/types/menu";
import { formatPriceVND, guestMenuApi } from "@/lib/guest-menu-api";

interface ModifierDialogProps {
    item: GuestMenuItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart: (
        item: GuestMenuItem,
        selections: Record<string, string[]>,
        quantity: number,
        total: number
    ) => void;
}

export function GuestModifierDialog({
    item,
    open,
    onOpenChange,
    onAddToCart,
}: ModifierDialogProps) {
    const [selections, setSelections] = useState<Record<string, string[]>>({});
    const [quantity, setQuantity] = useState(1);

    // Reset state when dialog opens/closes or item changes
    useEffect(() => {
        if (open && item) {
            // Set default selections
            const defaultSelections: Record<string, string[]> = {};
            item.modifierGroups?.forEach((group) => {
                const defaults = group.options
                    .filter((opt) => opt.isDefault)
                    .map((opt) => opt.id);
                if (defaults.length > 0) {
                    defaultSelections[group.id] = defaults;
                }
            });
            setSelections(defaultSelections);
            setQuantity(1);
        }
    }, [item, open]);

    if (!item) return null;

    // Calculate total price
    const calculateTotal = () => {
        if (!item.modifierGroups) return item.price * quantity;

        const modifierPrice = guestMenuApi.calculateItemTotal(
            item.price,
            item.modifierGroups,
            selections
        );
        return modifierPrice * quantity;
    };

    // Handle option selection
    const handleOptionChange = (
        groupId: string,
        optionId: string,
        type: "single" | "multiple",
        maxSelections: number
    ) => {
        setSelections((prev) => {
            if (type === "single") {
                return { ...prev, [groupId]: [optionId] };
            } else {
                const current = prev[groupId] || [];
                if (current.includes(optionId)) {
                    return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
                } else if (current.length < maxSelections) {
                    return { ...prev, [groupId]: [...current, optionId] };
                }
                return prev;
            }
        });
    };

    // Validate selections
    const isValid = () => {
        if (!item.modifierGroups) return true;

        const validation = guestMenuApi.validateSelections(
            item.modifierGroups,
            selections
        );
        return validation.valid;
    };

    const handleAddToCart = () => {
        if (isValid()) {
            onAddToCart(item, selections, quantity, calculateTotal());
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="p-4 border-b">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl mb-1">{item.name}</DialogTitle>
                            {item.description && (
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="flex-shrink-0"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Modifier Groups */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {item.modifierGroups?.map((group) => (
                        <div key={group.id} className="space-y-3">
                            {/* Group Header */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                                {group.isRequired && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                        Bắt buộc
                                    </span>
                                )}
                                {group.selectionType === "multiple" && (
                                    <span className="text-xs text-muted-foreground">
                                        (Chọn tối đa {group.maxSelections})
                                    </span>
                                )}
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                                {group.options.map((option) => {
                                    const isSelected = (selections[group.id] || []).includes(
                                        option.id
                                    );
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() =>
                                                handleOptionChange(
                                                    group.id,
                                                    option.id,
                                                    group.selectionType,
                                                    group.maxSelections
                                                )
                                            }
                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${isSelected
                                                    ? "border-orange-500 bg-orange-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {/* Checkbox/Radio */}
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                                                ? "border-orange-500 bg-orange-500"
                                                                : "border-gray-300"
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <Check className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-900">
                                                        {option.name}
                                                    </span>
                                                </div>
                                                {/* Price */}
                                                {option.price > 0 && (
                                                    <span className="text-sm font-semibold text-orange-600 flex-shrink-0 ml-2">
                                                        +{formatPriceVND(option.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* No modifiers message */}
                    {(!item.modifierGroups || item.modifierGroups.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Món này không có tùy chọn thêm
                        </p>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="border-t p-4 space-y-3 mt-auto">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-muted-foreground">Số lượng</span>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold w-8 text-center">{quantity}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        disabled={!isValid()}
                        className="w-full bg-orange-500 hover:bg-orange-600 h-12"
                    >
                        <span className="flex-1 text-left">Thêm vào giỏ hàng</span>
                        <span className="font-bold">{formatPriceVND(calculateTotal())}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}