import { GuestCategory } from "@/types/guest-menu";
import { Button } from "@/components/ui/button";

interface CategoryNavProps {
    categories: GuestCategory[];
    activeCategory: string;
    onCategoryClick: (id: string) => void;
}

export function GuestCategoryNav({
    categories,
    activeCategory,
    onCategoryClick,
}: CategoryNavProps) {
    return (
        <div className="bg-white border-b sticky top-[140px] z-10 overflow-x-auto">
            <div className="flex gap-2 p-3">
                {categories.map((cat) => (
                    <Button
                        key={cat.id}
                        onClick={() => onCategoryClick(cat.id)}
                        variant={activeCategory === cat.id ? "default" : "outline"}
                        size="sm"
                        className={`whitespace-nowrap ${activeCategory === cat.id
                                ? "bg-orange-500 hover:bg-orange-600"
                                : ""
                            }`}
                    >
                        {cat.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}