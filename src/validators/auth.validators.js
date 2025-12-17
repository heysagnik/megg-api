import { z } from 'zod';

// Mobile Google Auth
export const mobileGoogleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'ID token is required'),
  }),
});

// Profile update
export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  preferences: z.record(z.any()).optional(),
});

export const updateProfileMiddlewareSchema = z.object({
  body: updateProfileSchema,
});
