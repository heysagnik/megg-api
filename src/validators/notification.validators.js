import { z } from 'zod';

// Raw schema for service-level validation
export const notificationDataSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  user_id: z.string().optional(),
  type: z.string().default('info'),
  is_read: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// Kept for backward compatibility in services
export const createNotificationSchema = notificationDataSchema;

// Wrapped schemas for middleware validation
export const createNotificationMiddlewareSchema = z.object({
  body: notificationDataSchema
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  }).optional()
});
