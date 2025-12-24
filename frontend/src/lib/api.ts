import { MenuItem, MenuHealth } from '@/types/menu';

// Mock API client - replace with actual API endpoints
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const menuApi = {
  // Fetch all menu items
  getItems: async (): Promise<MenuItem[]> => {
    // Mock data for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Classic Burger',
            description: 'Juicy beef patty with fresh lettuce, tomato, and special sauce',
            price: 12.99,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
            categoryId: 'cat1',
            isAvailable: true,
            displayOrder: 1,
            modifierGroups: [],
            tags: ['popular', 'beef'],
          },
          {
            id: '2',
            name: 'Caesar Salad',
            description: 'Crisp romaine lettuce with parmesan and caesar dressing',
            price: 9.99,
            imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
            categoryId: 'cat2',
            isAvailable: true,
            displayOrder: 2,
            modifierGroups: [],
            tags: ['vegetarian'],
          },
          {
            id: '3',
            name: 'Margherita Pizza',
            description: 'Fresh mozzarella, tomato sauce, and basil',
            price: 14.99,
            imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
            categoryId: 'cat3',
            isAvailable: false,
            displayOrder: 3,
            modifierGroups: [],
            tags: ['vegetarian', 'popular'],
          },
        ]);
      }, 300);
    });
  },

  // Get single menu item
  getItem: async (id: string): Promise<MenuItem> => {
    const items = await menuApi.getItems();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Item not found');
    return item;
  },

  // Update menu item
  updateItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const item = { id, ...data } as MenuItem;
        resolve(item);
      }, 200);
    });
  },

  // Get menu health
  getMenuHealth: async (): Promise<MenuHealth> => {
    const items = await menuApi.getItems();
    return {
      totalItems: items.length,
      availableItems: items.filter(i => i.isAvailable).length,
      soldOutItems: items.filter(i => !i.isAvailable).length,
      itemsWithoutImage: items.filter(i => !i.imageUrl).length,
      itemsWithoutDescription: items.filter(i => !i.description).length,
    };
  },
};

