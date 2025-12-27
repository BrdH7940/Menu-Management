import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MenuItemFilters } from "@/types/menu";

interface SortBarProps {
  filters: MenuItemFilters;
  onFiltersChange: (filters: MenuItemFilters) => void;
}

export function SortBar({ filters, onFiltersChange }: SortBarProps) {
  // Support cả sort/sortBy và order/sortOrder
  const currentSort = filters.sort || filters.sortBy || "created_at";
  const currentOrder = filters.order || filters.sortOrder || "desc";

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sort: value as any,
      sortBy: value as any,
      page: 1,
    });
  };

  const handleOrderToggle = () => {
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    onFiltersChange({
      ...filters,
      order: newOrder,
      sortOrder: newOrder,
      page: 1,
    });
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
      <Select
        value={currentSort}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Ngày tạo</SelectItem>
          <SelectItem value="price">Giá</SelectItem>
          <SelectItem value="chef_choice">Chef Choice</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleOrderToggle}
        title={currentOrder === "asc" ? "Tăng dần" : "Giảm dần"}
      >
        {currentOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

