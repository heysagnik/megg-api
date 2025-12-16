import { z } from 'zod';

export const uploadVideoSchema = z.object({
    body: z.object({
        reelId: z.string().uuid('Invalid Reel ID')
    })
});

export const uploadImageSchema = z.object({
    body: z.object({
        productId: z.string().uuid('Invalid Product ID')
    })
});
