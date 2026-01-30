import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';

export const auth = new Hono();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_CACHE_TTL = 3600;

const getSessionUser = async (sql, sessionToken, env) => {
  if (!sessionToken || sessionToken.length < 10) return null;

  try {
    const cacheKey = `session:${sessionToken.substring(0, 32)}`;
    const cached = await env?.CACHE?.get(cacheKey, 'json');
    
    if (cached && new Date(cached.expires_at) > new Date()) {
      return cached.user;
    }

    const [session] = await sql`
      SELECT s.*, u.id as user_id, u.email, u.name, u.image as avatar
      FROM neon_auth.sessions s
      JOIN neon_auth.users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken}
      AND s.expires_at > NOW()
    `;

    if (!session) return null;

    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      avatar: session.avatar
    };

    const ttl = Math.min(SESSION_CACHE_TTL, Math.floor((new Date(session.expires_at) - Date.now()) / 1000));
    
    if (ttl > 0 && env?.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify({ 
        user, 
        expires_at: session.expires_at 
      }), { expirationTtl: ttl });
    }

    return user;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.substring(7);
  if (token.length < 10) {
    return c.json({ error: 'Invalid token format' }, 401);
  }

  const sql = neon(c.env.DATABASE_URL);
  const user = await getSessionUser(sql, token, c.env);

  if (!user) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  c.set('user', user);
  c.set('sql', sql);
  await next();
};

auth.get('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const sql = neon(c.env.DATABASE_URL);

    const user = await getSessionUser(sql, token, c.env);
    if (!user) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const profileCacheKey = `profile:${user.id}`;
    const cachedProfile = await c.env.CACHE?.get(profileCacheKey, 'json');
    if (cachedProfile) return c.json(cachedProfile);

    const [profile] = await sql`SELECT * FROM users WHERE id = ${user.id}`;

    if (!profile) {
      await sql`
        INSERT INTO users (id, full_name, avatar_url)
        VALUES (${user.id}, ${user.name}, ${user.avatar})
      `;
      const newProfile = { id: user.id, full_name: user.name, avatar_url: user.avatar };
      
      c.executionCtx.waitUntil(
        c.env.CACHE?.put(profileCacheKey, JSON.stringify(newProfile), { expirationTtl: 1800 })
      );
      
      return c.json(newProfile);
    }

    c.executionCtx.waitUntil(
      c.env.CACHE?.put(profileCacheKey, JSON.stringify(profile), { expirationTtl: 1800 })
    );

    return c.json(profile);
  } catch (error) {
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

auth.post('/sync', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const sql = neon(c.env.DATABASE_URL);

    const user = await getSessionUser(sql, token, c.env);
    if (!user) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const [existing] = await sql`SELECT id FROM users WHERE id = ${user.id}`;

    if (!existing) {
      await sql`
        INSERT INTO users (id, full_name, avatar_url)
        VALUES (${user.id}, ${user.name}, ${user.avatar})
      `;
      
      c.executionCtx.waitUntil(
        c.env.CACHE?.delete(`profile:${user.id}`)
      );
      
      return c.json({ success: true, isNew: true });
    }

    return c.json({ success: true, isNew: false });
  } catch (error) {
    return c.json({ error: 'Failed to sync user' }, 500);
  }
});

auth.get('/check', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ authenticated: false });
    }

    const token = authHeader.substring(7);
    const sql = neon(c.env.DATABASE_URL);
    const user = await getSessionUser(sql, token, c.env);

    return c.json({ authenticated: !!user, user: user || null });
  } catch (error) {
    return c.json({ authenticated: false });
  }
});
