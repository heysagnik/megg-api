import { z } from 'zod';

export const clickAnalyticsSchema = z.object({
  query: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    product_id: z.string().uuid().optional()
  })
});

