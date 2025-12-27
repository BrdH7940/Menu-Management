// components/guest/search-bar.tsx

import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    showChefOnly: boolean;
    onChefOnlyChange: (value: boolean) => void;
}

export function GuestSearchBar({
    search,
    onSearchChange,
    showChefOnly,
    onChefOnlyChange,
}: SearchBarProps) {
    return (
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="p-4 space-y-3">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Tìm kiếm món ăn..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Chef Recommendation Filter */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showChefOnly}
                        onChange={(e) => onChefOnlyChange(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded"
                    />
                    <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                    <span className="text-sm font-medium">Chỉ xem đề xuất của Chef</span>
                </label>
            </div>
        </div>
    );
}