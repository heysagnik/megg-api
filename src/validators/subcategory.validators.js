import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../config/constants.js';

export const createSubcategorySchema = z.object({
    name: z.string().min(1).max(100),
    category: z.string().refine(val => PRODUCT_CATEGORIES.includes(val), {
        message: 'Invalid category'
    }),
    display_order: z.number().int().min(0).optional().default(0)
});

export const updateSubcategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    category: z.string().refine(val => PRODUCT_CATEGORIES.includes(val), {
        message: 'Invalid category'
    }).optional(),
    display_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional()
});
