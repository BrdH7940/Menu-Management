// components/guest/menu-item-card.tsx

import { Star } from "lucide-react";
import { GuestMenuItem } from "@/types/menu";
import { formatPriceVND } from "@/lib/guest-menu-api";
import { Badge } from "@/components/ui/badge";

interface MenuItemCardProps {
    item: GuestMenuItem;
    onClick: () => void;
}

export function GuestMenuItemCard({ item, onClick }: MenuItemCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white rounded-xl border p-3 flex gap-3 hover:shadow-md transition-all text-left active:scale-[0.98]"
        >
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                {/* Title & Badge */}
                <div className="flex items-start gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                        {item.name}
                    </h3>
                    {item.isChefRecommended && (
                        <Badge className="bg-orange-500 hover:bg-orange-600 flex-shrink-0 text-[10px] h-5">
                            <Star className="h-3 w-3 mr-1 fill-white" />
                            Chef
                        </Badge>
                    )}
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Price & Prep Time */}
                <div className="flex items-center gap-2 pt-1">
                    <span className="font-bold text-orange-600">
                        {formatPriceVND(item.price)}
                    </span>
                    {item.prepTimeMinutes && (
                        <span className="text-xs text-muted-foreground">
                            • {item.prepTimeMinutes} phút
                        </span>
                    )}
                </div>
            </div>

            {/* Image */}
            {item.primaryPhotoUrl && (
                <img
                    src={item.primaryPhotoUrl}
                    alt={item.name}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                />
            )}
        </button>
    );
}