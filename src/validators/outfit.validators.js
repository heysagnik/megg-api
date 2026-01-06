import { z } from 'zod';

export const outfitDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  product_ids: z.array(z.string().uuid()).min(1, 'At least one product is required'),
  banner_image: z.string().url('Invalid banner image URL').optional()
});

export const outfitSchema = outfitDataSchema;

export const createOutfitSchema = z.object({
  body: outfitDataSchema
});

export const updateOutfitSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: outfitDataSchema.partial()
});

export const outfitIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});