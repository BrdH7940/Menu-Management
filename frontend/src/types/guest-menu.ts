// types/guest-menu.ts

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
    selectionType: 'single' | 'multiple';
    options: ModifierOption[];
    displayOrder: number;
    status: 'active' | 'inactive';
}

export interface GuestMenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    primaryPhotoUrl?: string;
    categoryId: string;
    categoryName: string;
    status: 'available';
    prepTimeMinutes?: number;
    isChefRecommended?: boolean;
    modifierGroups?: ModifierGroup[];
}

export interface GuestCategory {
    id: string;
    name: string;
    description?: string;
    status: 'active';
    items: GuestMenuItem[];
    displayOrder: number;
}

export interface GuestMenuResponse {
    restaurant_name?: string;
    categories: GuestCategory[];
}

export interface GuestMenuFilters {
    q?: string;
    categoryId?: string;
    sortBy?: 'popularity' | 'price' | 'chefRecommendation';
    isChefRecommended?: boolean;
}

export interface CartItem {
    item: GuestMenuItem;
    selections: Record<string, string[]>;
    quantity: number;
    totalPrice: number;
}

export interface ModifierSelection {
    groupId: string;
    groupName: string;
    selectedOptions: Array<{
        optionId: string;
        optionName: string;
        price: number;
    }>;
}