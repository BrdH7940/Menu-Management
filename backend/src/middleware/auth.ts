import { Request, Response, NextFunction } from 'express';

// Mock authentication middleware
// In production, this should verify JWT tokens and extract restaurant_id from session
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // For now, we'll use a mock restaurant_id from header or default
  // In production, extract from JWT token
  const restaurantId = req.headers['x-restaurant-id'] as string || '00000000-0000-0000-0000-000000000001';
  
  // Attach restaurant_id to request for use in routes
  (req as any).restaurantId = restaurantId;
  
  next();
}

