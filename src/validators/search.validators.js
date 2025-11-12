import { z } from 'zod';
import { PRODUCT_CATEGORIES, ALL_SUBCATEGORIES, PAGINATION } from '../config/constants.js';

export const unifiedSearchSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().optional(),
    sort: z.enum(['popularity', 'price_asc', 'price_desc', 'newest', 'oldest', 'clicks']).optional().default('popularity'),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).optional().default(PAGINATION.DEFAULT_LIMIT)
  }).refine(
    (data) => data.query || data.category || data.subcategory || data.color,
    { message: 'At least one search parameter (query, category, subcategory, or color) must be provided' }
  )
});

export const smartSearchSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Search query is required'),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).optional().default(PAGINATION.DEFAULT_LIMIT)
  })
});

export const advancedSearchSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    brand: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT)
  }).refine(
    (data) => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
    { message: 'minPrice must be less than or equal to maxPrice' }
  )
});

export const searchSuggestionsSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Query parameter is required for suggestions')
  })
});
