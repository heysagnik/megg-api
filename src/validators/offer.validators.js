import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

export const listOffersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT)
  })
});

export const createOfferSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    banner_image: z.string().url('Banner image must be a valid URL').optional(),
    affiliate_link: z.string().url().optional()
  })
});

export const updateOfferSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    banner_image: z.string().url().optional(),
    affiliate_link: z.string().url().optional()
  })
});

export const offerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

