import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestMenuFilters } from "@/types/guest-menu";

interface SortBarProps {
    filters: GuestMenuFilters;
    onFiltersChange: (filters: GuestMenuFilters) => void;
}

export function SortBar({ filters, onFiltersChange }: SortBarProps) {
  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sort: value as any,
      page: 1,
    });
  };

  const handleOrderToggle = () => {
    onFiltersChange({
      ...filters,
      order: filters.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select
        value={filters.sort || "created_at"}
        onValueChange={handleSortChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Created Date</SelectItem>
          <SelectItem value="price">Price</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleOrderToggle}
        title={filters.order === "asc" ? "Ascending" : "Descending"}
      >
        {filters.order === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

