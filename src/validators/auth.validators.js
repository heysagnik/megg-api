import { z } from 'zod';

// Raw schemas for service-level validation
export const googleAuthDataSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const updateProfileDataSchema = z.object({
  username: z.string().min(3).optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Kept for backward compatibility in services
export const googleAuthSchema = googleAuthDataSchema;
export const updateProfileSchema = updateProfileDataSchema;

// Wrapped schemas for middleware validation
export const googleAuthMiddlewareSchema = z.object({
  body: googleAuthDataSchema
});

export const updateProfileMiddlewareSchema = z.object({
  body: updateProfileDataSchema
});

// Mobile Google Auth Schema
export const mobileGoogleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'ID token is required'),
  }),
});

