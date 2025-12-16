import { sql } from '../config/neon.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { updateProfileSchema } from '../validators/auth.validators.js';

import logger from '../utils/logger.js';
import crypto from 'crypto';
import fetch from 'node-fetch';

export const exchangeGoogleToken = async (token) => {
  throw new Error('This authentication method is migrated to Neon Auth. Please use the standard login flow.');
};

export const exchangeGoogleIdToken = async (idToken, userAgent, ipAddress) => {
  // 1. Verify ID token with Google
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

  if (!response.ok) {
    throw new UnauthorizedError('Invalid Google ID token');
  }

  const payload = await response.json();

  // 2. Verify audience (optional but recommended)
  if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    logger.warn('Google token audience mismatch', { expected: process.env.GOOGLE_CLIENT_ID, received: payload.aud });
  }

  const { email, sub: googleId, name, picture } = payload;

  // 3. Find or create user
  let user = await sql(
    'SELECT * FROM "user" WHERE email = $1 LIMIT 1',
    [email]
  );

  let userId;
  if (user && user.length > 0) {
    userId = user[0].id;
    user = user[0];
  } else {
    // Create new user
    userId = crypto.randomUUID();
    const now = new Date();

    const newUser = await sql(
      `INSERT INTO "user" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, email, name, picture, true, now, now]
    );
    user = newUser[0];

    // Create account link for Better Auth compatibility
    await sql(
      `INSERT INTO "account" (id, "userId", "accountId", "providerId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), userId, googleId, 'google', now, now]
    );
  }

  // 4. Create session
  const sessionToken = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const now = new Date();

  const session = await sql(
    `INSERT INTO "session" (id, "userId", token, "expiresAt", "createdAt", "updatedAt", "ipAddress", "userAgent")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [sessionId, userId, sessionToken, expiresAt, now, now, ipAddress || '127.0.0.1', userAgent || 'mobile-app']
  );

  return { user, session: session[0] };
};

export const getUserProfile = async (userId) => {
  const [user] = await sql(
    `SELECT id, email, name, image as avatar_url, "phoneNumber", role, preferences, "createdAt" 
     FROM "user" WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Parse preferences if it's a string (Better Auth stores it as string/text)
  if (user.preferences && typeof user.preferences === 'string') {
    try {
      user.preferences = JSON.parse(user.preferences);
    } catch (e) {
      user.preferences = {};
    }
  }

  return user;
};

export const updateUserProfile = async (userId, updates) => {
  const validation = updateProfileSchema.safeParse(updates);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const validUpdates = validation.data;

  // Map old field names to new table columns
  if (validUpdates.avatar_url) {
    validUpdates.image = validUpdates.avatar_url;
    delete validUpdates.avatar_url;
  }
  if (validUpdates.full_name) { // If client sends full_name
    validUpdates.name = validUpdates.full_name;
    delete validUpdates.full_name;
  }

  // Handle preferences
  if (validUpdates.preferences) {
    if (typeof validUpdates.preferences === 'object') {
      validUpdates.preferences = JSON.stringify(validUpdates.preferences);
    }
  }

  const keys = Object.keys(validUpdates);
  if (keys.length === 0) return getUserProfile(userId);

  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
  const values = [userId, ...keys.map(k => validUpdates[k])];

  const [updatedUser] = await sql(
    `UPDATE "user" SET ${setFragments.join(', ')} WHERE id = $1 
     RETURNING id, email, name, image as avatar_url, "phoneNumber", role, preferences, "createdAt"`,
    values
  );

  if (!updatedUser) {
    throw new Error('Failed to update user profile');
  }

  // Parse preferences
  if (updatedUser.preferences && typeof updatedUser.preferences === 'string') {
    try {
      updatedUser.preferences = JSON.parse(updatedUser.preferences);
    } catch (e) {
      updatedUser.preferences = {};
    }
  }

  return updatedUser;
};

export const checkAdminStatus = async (userId) => {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  return adminIds.includes(userId);
};
