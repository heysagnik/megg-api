import { z } from 'zod';

// Reel data schema
export const reelDataSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  product_ids: z.array(z.string().uuid()).default([]),
  video_url: z.string().url().optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable()
});

export const reelSchema = reelDataSchema;

// Middleware schemas
export const createReelSchema = z.object({
  body: reelDataSchema
});

export const updateReelSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: reelDataSchema.partial()
});

export const reelIdSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

export const categorySchema = z.object({
  params: z.object({ category: z.string().min(1) })
});
