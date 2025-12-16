import { z } from 'zod';

// Raw schema for service-level validation
export const bannerDataSchema = z.object({
  link: z.string().url('Invalid link URL').optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  display_order: z.coerce.number().int().default(0)
});

// Wrapped schemas for middleware validation
export const bannerSchema = bannerDataSchema;

export const createBannerSchema = z.object({
  body: bannerDataSchema
});

export const updateBannerSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: bannerDataSchema.partial().extend({
    category: z.string().min(1).optional()
  })
});

export const bannerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});
