import { z } from 'zod';
import { VIDEO_CATEGORIES } from '../config/constants.js';

export const createReelSchema = z.object({
  body: z.object({
    category: z.enum(VIDEO_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
    video_url: z.string().url('Video URL must be valid'),
    thumbnail_url: z.string().url('Thumbnail URL must be valid'),
    product_ids: z.array(z.string().uuid()).default([])
  })
});

export const updateReelSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    category: z.enum(VIDEO_CATEGORIES).optional(),
    video_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional(),
    product_ids: z.array(z.string().uuid()).optional()
  })
});

export const reelIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const categorySchema = z.object({
  params: z.object({
    category: z.enum(VIDEO_CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) })
  })
});

