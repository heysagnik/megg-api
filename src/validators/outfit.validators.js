import { z } from 'zod';

export const createOutfitSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    banner_image: z.string().url('Banner image must be a valid URL'),
    affiliate_link: z.string().url('Affiliate link must be a valid URL')
  })
});

export const updateOutfitSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    banner_image: z.string().url().optional(),
    affiliate_link: z.string().url().optional()
  })
});

export const outfitIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});