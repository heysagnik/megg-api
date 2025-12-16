import { z } from 'zod';

const searchParams = z.object({
  query: z.string().optional().transform(val => val || undefined),
  category: z.string().optional().transform(val => val || undefined),
  subcategory: z.string().optional().transform(val => val || undefined),
  color: z.string().optional().transform(val => val || undefined),
  brand: z.string().optional().transform(val => val || undefined),
  sort: z.enum(['popularity', 'price_asc', 'price_desc', 'newest', 'oldest', 'relevance']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Wrap in query object to match validate middleware structure
export const unifiedSearchSchema = z.object({
  query: searchParams
});

export const smartSearchSchema = z.object({
  query: searchParams
});

export const searchSuggestionsSchema = z.object({
  query: z.object({
    query: z.string().min(1)
  })
});

export const advancedSearchSchema = z.object({
  query: searchParams.extend({
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
  })
});

export const unifiedSearchPostSchema = z.object({
  query: searchParams,
  body: z.object({
    embedding: z.array(z.number()).length(384).optional()
  })
});
