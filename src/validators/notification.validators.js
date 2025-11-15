import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    link: z.string().url().optional()
  })
});

export const notificationIdSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});
