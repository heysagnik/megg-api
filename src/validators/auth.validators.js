import { z } from 'zod';

export const googleAuthSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().optional(),
    avatar_url: z.string().url().optional(),
    preferences: z.record(z.any()).optional()
  })
});

