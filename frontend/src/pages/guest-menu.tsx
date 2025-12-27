/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useGuestMenu } from "@/hooks/use-guest-menu";
import { FilterBar } from "@/components/menu/filter-bar";
import { SortBar } from "@/components/menu/sort-bar";
import { GuestItemDialog } from "@/components/menu/guest-item-dialog";
import { GuestMenuItem, MenuItem } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import { formatPriceVND } from "@/lib/api";

export function GuestMenuPage() {
    const [filters, setFilters] = useState({ q: "", categoryId: "", sortBy: "price" });
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    const { data: menuData, isLoading } = useGuestMenu(filters as any);

    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            {/* Header & Sticky Search/Filter */}
            <div className="sticky top-0 z-30 bg-white shadow-sm">
                <div className="p-4 space-y-4">
                    <h1 className="text-2xl font-bold text-primary">Smart Menu 🍽️</h1>
                </div>
                <FilterBar filters={filters} onFiltersChange={(f) => setFilters(prev => ({ ...prev, ...f }))} />
                <SortBar filters={filters} onFiltersChange={(f) => setFilters(prev => ({ ...prev, ...f }))} />
            </div>

            {/* List Món ăn */}
            <main className="h-[calc(100vh-220px)] overflow-y-auto p-4 space-y-8">
                {isLoading ? (
                    <div className="text-center py-20 text-muted-foreground animate-pulse">Đang tải thực đơn...</div>
                ) : (
                    menuData?.categories.map(category => (
                        <section key={category.id} id={category.id} className="space-y-4">
                            <h2 className="text-lg font-bold border-l-4 border-primary pl-3">{category.name}</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {category.items.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item as any)}
                                        className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-transparent active:border-primary transition-all"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                                {item.isChefRecommended && (
                                                    <Badge className="bg-orange-500 hover:bg-orange-600 text-[9px] h-4">Chef Choice</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                            <p className="font-bold text-primary">{formatPriceVND(item.price)}</p>
                                        </div>
                                        {item.primaryPhotoUrl && (
                                            <img src={item.primaryPhotoUrl} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* Dialog chọn Modifiers */}
            <GuestItemDialog
                item={selectedItem}
                open={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}