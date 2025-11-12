import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../config/constants.js';

export const createBannerSchema = z.object({
  body: z.object({
    category: z.enum(PRODUCT_CATEGORIES),
    link: z.string().url('Link must be a valid URL'),
    display_order: z.coerce.number().int().min(0).default(0)
  })
});

export const updateBannerSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    link: z.string().url().optional(),
    display_order: z.coerce.number().int().min(0).optional()
  })
});

export const bannerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const bannerCategorySchema = z.object({
  params: z.object({
    category: z.enum(PRODUCT_CATEGORIES)
  })
});

