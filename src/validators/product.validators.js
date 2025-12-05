import { z } from 'zod';
import { PRODUCT_CATEGORIES, ALL_SUBCATEGORIES, PAGINATION } from '../config/constants.js';

export const listProductsSchema = z.object({
  query: z.object({
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['popularity', 'price_asc', 'price_desc', 'newest', 'oldest']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT)
  })
});

export const browseCategorySchema = z.object({
  params: z.object({
    category: z.enum(PRODUCT_CATEGORIES)
  }),
  query: z.object({
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().optional(),
    sort: z.enum(['popularity', 'price_asc', 'price_desc', 'newest', 'oldest']).default('popularity'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT)
  })
});

// Schema for API-based product creation (with image URLs)
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    brand: z.string().min(1, 'Brand is required'),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
    category: z.enum(PRODUCT_CATEGORIES),
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().min(1, 'Color is required'),
    suggested_colors: z.array(z.string()).default([]),
    affiliate_link: z.string().url().optional()
  })
});

// Schema for multipart/form-data product creation (images uploaded as files)
// Note: Images come from req.files, not req.body
export const createProductWithFilesSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    price: z.union([
      z.number().positive('Price must be positive'),
      z.string().transform((val) => {
        const parsed = parseFloat(val);
        if (isNaN(parsed) || parsed <= 0) throw new Error('Price must be a positive number');
        return parsed;
      })
    ]),
    brand: z.string().min(1, 'Brand is required'),
    category: z.enum(PRODUCT_CATEGORIES),
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().min(1, 'Color is required'),
    suggested_colors: z.union([
      z.array(z.string()),
      z.string().transform((val) => {
        try { return JSON.parse(val); } catch { return []; }
      })
    ]).default([]),
    affiliate_link: z.string().url().optional().or(z.literal(''))
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    brand: z.string().min(1).optional(),
    images: z.array(z.string().url()).optional(),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    subcategory: z.enum(ALL_SUBCATEGORIES).optional(),
    color: z.string().optional(),
    suggested_colors: z.array(z.string()).optional(),
    affiliate_link: z.string().url().optional()
  })
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

