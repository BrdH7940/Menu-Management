export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  displayOrder: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
  displayOrder: number;
  modifierGroups: ModifierGroup[];
  tags?: string[];
}

export interface MenuHealth {
  totalItems: number;
  availableItems: number;
  soldOutItems: number;
  itemsWithoutImage: number;
  itemsWithoutDescription: number;
}

