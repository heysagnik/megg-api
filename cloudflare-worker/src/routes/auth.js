import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';

export const auth = new Hono();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getSessionUser = async (sql, sessionToken) => {
    if (!sessionToken || sessionToken.length < 10) return null;

    try {
        const [session] = await sql`
      SELECT s.*, u.id as user_id, u.email, u.name, u.image as avatar
      FROM neon_auth.sessions s
      JOIN neon_auth.users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken}
      AND s.expires_at > NOW()
    `;

        if (!session) return null;

        return {
            id: session.user_id,
            email: session.email,
            name: session.name,
            avatar: session.avatar
        };
    } catch (error) {
        console.error('Session verification error:', error.message);
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
    const user = await getSessionUser(sql, token);

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

        const user = await getSessionUser(sql, token);
        if (!user) {
            return c.json({ error: 'Invalid session' }, 401);
        }

        const [profile] = await sql`SELECT * FROM users WHERE id = ${user.id}`;

        if (!profile) {
            await sql`
        INSERT INTO users (id, full_name, avatar_url)
        VALUES (${user.id}, ${user.name}, ${user.avatar})
      `;
            return c.json({ id: user.id, full_name: user.name, avatar_url: user.avatar });
        }

        return c.json(profile);
    } catch (error) {
        console.error('Profile fetch error:', error.message);
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

        const user = await getSessionUser(sql, token);
        if (!user) {
            return c.json({ error: 'Invalid session' }, 401);
        }

        const [existing] = await sql`SELECT id FROM users WHERE id = ${user.id}`;

        if (!existing) {
            await sql`
        INSERT INTO users (id, full_name, avatar_url)
        VALUES (${user.id}, ${user.name}, ${user.avatar})
      `;
            return c.json({ success: true, isNew: true });
        }

        return c.json({ success: true, isNew: false });
    } catch (error) {
        console.error('Sync error:', error.message);
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
        const user = await getSessionUser(sql, token);

        return c.json({ authenticated: !!user, user: user || null });
    } catch (error) {
        return c.json({ authenticated: false });
    }
});
