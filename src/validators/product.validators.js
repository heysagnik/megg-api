import { z } from 'zod';

// Base schemas for reuse
const listProductsParams = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  color: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['popularity', 'price_asc', 'price_desc', 'oldest', 'newest']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Wrapped schemas for middleware validation
export const listProductsSchema = z.object({
  query: listProductsParams
});

export const browseCategorySchema = z.object({
  params: z.object({
    category: z.string().min(1)
  }),
  query: listProductsParams.omit({ category: true }).optional()
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

const productDataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  color: z.string().optional(),
  fabric: z.union([z.string(), z.array(z.string())]).optional(),
  affiliate_link: z.string().url().optional().or(z.literal('')),
  is_active: z.coerce.boolean().default(true),
  semantic_tags: z.array(z.string()).optional().default([]),
  images: z.array(z.any()).optional(),
});

export const createProductSchema = z.object({
  body: productDataSchema
});

export const createProductWithFilesSchema = z.object({
  body: productDataSchema
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: productDataSchema.partial()
});

// Export raw schemas for direct service use (without middleware wrapper)
export const productDataSchemaRaw = productDataSchema;
export const listProductsParamsRaw = listProductsParams;
