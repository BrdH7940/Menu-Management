import { randomUUID } from "crypto";

export type ItemStatus = "available" | "unavailable" | "sold_out";

export interface MockCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface MockPhoto {
  id: string;
  menuItemId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface MockMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes: number;
  status: ItemStatus;
  isChefRecommended: boolean;
  isDeleted: boolean;
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
}

// Simple in-memory stores (per-process only)
export const categories: MockCategory[] = [
  {
    id: "cat-1",
    restaurantId: "00000000-0000-0000-0000-000000000001",
    name: "Burgers",
    description: "Delicious grilled burgers",
    displayOrder: 1,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-2",
    restaurantId: "00000000-0000-0000-0000-000000000001",
    name: "Salads",
    description: "Fresh and healthy salads",
    displayOrder: 2,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const menuItems: MockMenuItem[] = [
  {
    id: "item-1",
    restaurantId: "00000000-0000-0000-0000-000000000001",
    categoryId: "cat-1",
    name: "Classic Burger",
    description: "Juicy beef patty with lettuce, tomato, and sauce",
    price: 12.99,
    prepTimeMinutes: 15,
    status: "available",
    isChefRecommended: true,
    isDeleted: false,
    popularityScore: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "item-2",
    restaurantId: "00000000-0000-0000-0000-000000000001",
    categoryId: "cat-2",
    name: "Caesar Salad",
    description: "Crisp romaine lettuce with parmesan and caesar dressing",
    price: 9.99,
    prepTimeMinutes: 10,
    status: "available",
    isChefRecommended: false,
    isDeleted: false,
    popularityScore: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const photos: MockPhoto[] = [];

export function createMockItemId() {
  return randomUUID();
}

export function createMockPhotoId() {
  return randomUUID();
}
