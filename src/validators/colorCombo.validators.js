import { z } from 'zod';

export const createColorComboSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    color_a: z.string().min(1, 'Color A is required'),
    color_b: z.string().min(1, 'Color B is required'),
    group_type: z.enum(['layering', 'winter', 'casual', 'formal']).optional(),
    product_ids: z.array(z.string().uuid()).optional(),
    model_image: z.string().url().optional()
  })
});

export const updateColorComboSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).optional(),
    color_a: z.string().optional(),
    color_b: z.string().optional(),
    group_type: z.enum(['layering', 'winter', 'casual', 'formal']).optional(),
    product_ids: z.array(z.string().uuid()).optional(),
    model_image: z.string().url().optional(),
    prev_model_image: z.string().url().optional()
  })
});

export const colorComboIdSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});


