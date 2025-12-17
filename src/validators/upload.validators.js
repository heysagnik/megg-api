import { z } from 'zod';

// Video upload - reelId is optional (will be generated if not provided)
export const uploadVideoSchema = z.object({
    body: z.object({
        reelId: z.string().uuid('Invalid Reel ID').optional()
    })
});

// Image upload - productId is optional (will be generated if not provided)
export const uploadImageSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid Product ID').optional()
    })
});
