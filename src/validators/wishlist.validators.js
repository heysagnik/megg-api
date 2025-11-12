import { z } from 'zod';

export const addToWishlistSchema = z.object({
  body: z.object({
    product_id: z.string().uuid('Invalid product ID')
  })
});

export const removeFromWishlistSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID')
  })
});

