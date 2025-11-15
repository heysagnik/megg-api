import { z } from 'zod';

export const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    body: z.string().min(1, 'Body is required').max(500),
    image: z.string().url().optional(),
    link: z.string().optional()
  })
});
