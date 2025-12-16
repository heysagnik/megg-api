import { z } from 'zod';

export const addToWishlistSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid Product ID')
  })
});

export const removeFromWishlistSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid Product ID')
  })
});
