import { z } from 'zod';

// Raw schema for service-level validation
export const offerDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  affiliate_link: z.string().url('Invalid link').optional().or(z.literal(''))
});

// Kept for backward compatibility in services
export const offerSchema = offerDataSchema;

// Wrapped schemas for middleware validation
export const createOfferSchema = z.object({
  body: offerDataSchema
});

export const updateOfferSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: offerDataSchema.partial()
});

export const offerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const listOffersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional()
  }).optional()
});
