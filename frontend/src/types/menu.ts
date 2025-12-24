export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

// Type matching backend snake_case response
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  status?: 'active' | 'inactive';
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  itemCount?: number;
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
  primaryPhotoUrl?: string;
  categoryId: string;
  categoryName?: string;
  status: 'available' | 'unavailable' | 'sold_out';
  isAvailable?: boolean; // For backward compatibility
  prepTimeMinutes?: number;
  isChefRecommended?: boolean;
  popularityScore?: number;
  displayOrder?: number;
  modifierGroups?: ModifierGroup[];
  tags?: string[];
  photos?: MenuItemPhoto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface MenuItemListResponse {
  items: MenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MenuItemFilters {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  status?: 'available' | 'unavailable' | 'sold_out';
  sort?: 'price' | 'created_at' | 'popularity';
  order?: 'asc' | 'desc';
}

export interface MenuHealth {
  totalItems: number;
  availableItems: number;
  soldOutItems: number;
  itemsWithoutImage: number;
  itemsWithoutDescription: number;
}

