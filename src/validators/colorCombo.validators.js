import { z } from 'zod';

// Raw schema for service-level validation
export const colorComboDataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color_a: z.string().min(1, 'Color A is required'),
  color_b: z.string().min(1, 'Color B is required'),
  product_ids: z.preprocess(
    (val) => {
      // Handle null, undefined, empty string
      if (val === null || val === undefined || val === '') return [];
      // If already array, return as-is
      if (Array.isArray(val)) return val;
      // If string, try to parse as JSON
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    },
    z.array(z.string().uuid()).default([])
  ),
  group_type: z.string().nullable().optional(),
  model_image: z.any().optional() // Accept any type since it could be null, undefined, string, or object
});

// Kept for backward compatibility in services
export const colorComboSchema = colorComboDataSchema;

// Wrapped schemas for middleware validation
export const createColorComboSchema = z.object({
  body: colorComboDataSchema
});

export const updateColorComboSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: colorComboDataSchema.partial()
});

export const colorComboIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});
