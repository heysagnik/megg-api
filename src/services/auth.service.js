import { sql } from '../config/neon.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { updateProfileSchema } from '../validators/auth.validators.js';
import crypto from 'crypto';

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export const exchangeGoogleIdToken = async (idToken, userAgent, ipAddress) => {
  // Verify ID token with Google
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) throw new UnauthorizedError('Invalid Google ID token');

  const payload = await response.json();
  const { email, sub: googleId, name, picture } = payload;

  // Find or create user
  let [user] = await sql('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email]);

  const now = new Date();
  let userId;

  if (user) {
    userId = user.id;
  } else {
    userId = crypto.randomUUID();
    [user] = await sql(
      `INSERT INTO "user" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, email, name, picture, true, now, now]
    );

    // Link Google account
    await sql(
      `INSERT INTO "account" (id, "userId", "accountId", "providerId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), userId, googleId, 'google', now, now]
    );
  }

  // Create session
  const sessionToken = crypto.randomUUID();
  const [session] = await sql(
    `INSERT INTO "session" (id, "userId", token, "expiresAt", "createdAt", "updatedAt", "ipAddress", "userAgent")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [crypto.randomUUID(), userId, sessionToken, new Date(Date.now() + SESSION_DURATION), now, now, ipAddress || '', userAgent || 'mobile']
  );

  return { user, session };
};

export const validateSession = async (token) => {
  if (!token) return null;

  const [session] = await sql(
    `SELECT s.*, u.id as "userId", u.email, u.name, u.image, u.role 
     FROM "session" s JOIN "user" u ON s."userId" = u.id 
     WHERE s.token = $1 AND s."expiresAt" > NOW() LIMIT 1`,
    [token]
  );

  return session || null;
};

export const getUserProfile = async (userId) => {
  const [user] = await sql(
    `SELECT id, email, name, image as avatar_url, "phoneNumber", role, preferences, "createdAt" 
     FROM "user" WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (!user) throw new Error('User not found');

  if (user.preferences && typeof user.preferences === 'string') {
    try { user.preferences = JSON.parse(user.preferences); } catch { user.preferences = {}; }
  }

  return user;
};

export const updateUserProfile = async (userId, updates) => {
  const validation = updateProfileSchema.safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const data = { ...validation.data };

  // Field mapping
  if (data.avatar_url) { data.image = data.avatar_url; delete data.avatar_url; }
  if (data.full_name) { data.name = data.full_name; delete data.full_name; }
  if (data.preferences && typeof data.preferences === 'object') {
    data.preferences = JSON.stringify(data.preferences);
  }

  const keys = Object.keys(data);
  if (keys.length === 0) return getUserProfile(userId);

  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
  const [user] = await sql(
    `UPDATE "user" SET ${setFragments.join(', ')} WHERE id = $1 
     RETURNING id, email, name, image as avatar_url, "phoneNumber", role, preferences, "createdAt"`,
    [userId, ...keys.map(k => data[k])]
  );

  if (!user) throw new Error('Failed to update profile');

  if (user.preferences && typeof user.preferences === 'string') {
    try { user.preferences = JSON.parse(user.preferences); } catch { user.preferences = {}; }
  }

  return user;
};

export const logout = async (token) => {
  await sql('DELETE FROM "session" WHERE token = $1', [token]);
};
