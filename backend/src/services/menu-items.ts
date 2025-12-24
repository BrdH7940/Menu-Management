import {
  categories,
  menuItems,
  photos,
  createMockItemId,
  MockMenuItem,
} from "../mock/data.js";

interface MenuItemFilter {
  page: number;
  limit: number;
  q?: string;
  categoryId?: string;
  status?: "available" | "unavailable" | "sold_out";
  sort: "price" | "created_at" | "popularity";
  order: "asc" | "desc";
}

export async function getMenuItems(
  restaurantId: string,
  filter: MenuItemFilter
) {
  const { page, limit, q, categoryId, status, sort, order } = filter;

  let items = menuItems.filter(
    (mi) => mi.restaurantId === restaurantId && !mi.isDeleted
  );

  if (q) {
    const qLower = q.toLowerCase();
    items = items.filter((mi) => mi.name.toLowerCase().includes(qLower));
  }

  if (categoryId) {
    items = items.filter((mi) => mi.categoryId === categoryId);
  }

  if (status) {
    items = items.filter((mi) => mi.status === status);
  }

  // Sorting
  items = [...items].sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "price":
        cmp = a.price - b.price;
        break;
      case "popularity":
        cmp = a.popularityScore - b.popularityScore;
        break;
      case "created_at":
      default:
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return order === "asc" ? cmp : -cmp;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * limit;
  const paged = items.slice(start, start + limit);

  const resultItems = paged.map((mi) => {
    const category = categories.find((c) => c.id === mi.categoryId);
    const itemPhotos = photos.filter((p) => p.menuItemId === mi.id);
    const primary = itemPhotos.find((p) => p.isPrimary) || itemPhotos[0];

    return {
      id: mi.id,
      name: mi.name,
      description: mi.description,
      price: mi.price,
      prepTimeMinutes: mi.prepTimeMinutes,
      status: mi.status,
      isChefRecommended: mi.isChefRecommended,
      popularityScore: mi.popularityScore,
      createdAt: mi.createdAt,
      updatedAt: mi.updatedAt,
      categoryId: mi.categoryId,
      categoryName: category?.name,
      primaryPhotoUrl: primary?.url,
    };
  });

  return {
    items: resultItems,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getMenuItemById(id: string, restaurantId: string) {
  const mi = menuItems.find(
    (item) =>
      item.id === id && item.restaurantId === restaurantId && !item.isDeleted
  );
  if (!mi) return null;

  const category = categories.find((c) => c.id === mi.categoryId);
  const itemPhotos = photos.filter((p) => p.menuItemId === mi.id);

  return {
    id: mi.id,
    name: mi.name,
    description: mi.description,
    price: mi.price,
    prepTimeMinutes: mi.prepTimeMinutes,
    status: mi.status,
    isChefRecommended: mi.isChefRecommended,
    popularityScore: mi.popularityScore,
    createdAt: mi.createdAt,
    updatedAt: mi.updatedAt,
    categoryId: mi.categoryId,
    categoryName: category?.name,
    photos: itemPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      isPrimary: p.isPrimary,
      createdAt: p.createdAt,
    })),
  };
}

export async function createMenuItem(restaurantId: string, data: any) {
  const now = new Date().toISOString();
  const newItem: MockMenuItem = {
    id: createMockItemId(),
    restaurantId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || "",
    price: data.price,
    prepTimeMinutes: data.prepTimeMinutes || 0,
    status: data.status,
    isChefRecommended: data.isChefRecommended || false,
    isDeleted: false,
    popularityScore: 0,
    createdAt: now,
    updatedAt: now,
  };

  menuItems.push(newItem);

  return {
    id: newItem.id,
    name: newItem.name,
    description: newItem.description,
    price: newItem.price,
    prepTimeMinutes: newItem.prepTimeMinutes,
    status: newItem.status,
    isChefRecommended: newItem.isChefRecommended,
    createdAt: newItem.createdAt,
    updatedAt: newItem.updatedAt,
    categoryId: newItem.categoryId,
  };
}

export async function updateMenuItem(
  id: string,
  restaurantId: string,
  data: any
) {
  const mi = menuItems.find(
    (item) =>
      item.id === id && item.restaurantId === restaurantId && !item.isDeleted
  );
  if (!mi) return null;

  if (data.name !== undefined) mi.name = data.name;
  if (data.categoryId !== undefined) mi.categoryId = data.categoryId;
  if (data.description !== undefined) mi.description = data.description;
  if (data.price !== undefined) mi.price = data.price;
  if (data.prepTimeMinutes !== undefined)
    mi.prepTimeMinutes = data.prepTimeMinutes;
  if (data.status !== undefined) mi.status = data.status;
  if (data.isChefRecommended !== undefined)
    mi.isChefRecommended = data.isChefRecommended;

  mi.updatedAt = new Date().toISOString();

  return getMenuItemById(id, restaurantId);
}

export async function deleteMenuItem(id: string, restaurantId: string) {
  const mi = menuItems.find(
    (item) =>
      item.id === id && item.restaurantId === restaurantId && !item.isDeleted
  );
  if (!mi) return false;

  mi.isDeleted = true;
  mi.updatedAt = new Date().toISOString();
  return true;
}
