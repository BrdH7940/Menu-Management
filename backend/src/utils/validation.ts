import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const menuItemFilterSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['available', 'unavailable', 'sold_out']).optional(),
  sort: z.enum(['price', 'created_at', 'popularity']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).merge(paginationSchema);

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(80),
  categoryId: z.string().uuid(),
  price: z.number().positive().max(999999),
  description: z.string().optional(),
  prepTimeMinutes: z.number().int().min(0).max(240).optional(),
  status: z.enum(['available', 'unavailable', 'sold_out']),
  isChefRecommended: z.boolean().optional().default(false),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

