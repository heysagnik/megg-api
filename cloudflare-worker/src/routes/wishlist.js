import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';

export const wishlist = new Hono();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getSessionUser = async (sql, sessionToken) => {
    if (!sessionToken || sessionToken.length < 10) return null;

    try {
        const [session] = await sql`
      SELECT s.*, u.id as user_id, u.email, u.name
      FROM neon_auth.sessions s
      JOIN neon_auth.users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken}
      AND s.expires_at > NOW()
    `;

        if (!session) return null;
        return { id: session.user_id, email: session.email, name: session.name };
    } catch (error) {
        console.error('Session verification error:', error.message);
        return null;
    }
};

const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const sql = neon(c.env.DATABASE_URL);

    const user = await getSessionUser(sql, token);
    if (!user) {
        return c.json({ error: 'Invalid or expired session' }, 401);
    }

    c.set('user', user);
    c.set('sql', sql);
    await next();
};

wishlist.use('*', authMiddleware);

wishlist.get('/', async (c) => {
    try {
        const user = c.get('user');
        const sql = c.get('sql');

        const items = await sql`
      SELECT w.id as wishlist_id, w.added_at, p.*
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ${user.id}
      ORDER BY w.added_at DESC
    `;

        return c.json({ items, count: items.length });
    } catch (error) {
        console.error('Wishlist fetch error:', error.message);
        return c.json({ error: 'Failed to fetch wishlist' }, 500);
    }
});

wishlist.post('/:productId', async (c) => {
    try {
        const user = c.get('user');
        const sql = c.get('sql');
        const productId = c.req.param('productId');

        if (!UUID_REGEX.test(productId)) {
            return c.json({ error: 'Invalid product ID format' }, 400);
        }

        const [product] = await sql`SELECT id FROM products WHERE id = ${productId}`;
        if (!product) {
            return c.json({ error: 'Product not found' }, 404);
        }

        const [existing] = await sql`
      SELECT id FROM wishlist 
      WHERE user_id = ${user.id} AND product_id = ${productId}
    `;

        if (existing) {
            return c.json({ message: 'Already in wishlist', id: existing.id });
        }

        const [item] = await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${user.id}, ${productId})
      RETURNING *
    `;

        return c.json({ success: true, item }, 201);
    } catch (error) {
        console.error('Wishlist add error:', error.message);
        return c.json({ error: 'Failed to add to wishlist' }, 500);
    }
});

wishlist.delete('/:productId', async (c) => {
    try {
        const user = c.get('user');
        const sql = c.get('sql');
        const productId = c.req.param('productId');

        if (!UUID_REGEX.test(productId)) {
            return c.json({ error: 'Invalid product ID format' }, 400);
        }

        const result = await sql`
      DELETE FROM wishlist 
      WHERE user_id = ${user.id} AND product_id = ${productId}
      RETURNING id
    `;

        if (result.length === 0) {
            return c.json({ error: 'Item not in wishlist' }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error('Wishlist delete error:', error.message);
        return c.json({ error: 'Failed to remove from wishlist' }, 500);
    }
});

wishlist.get('/check/:productId', async (c) => {
    try {
        const user = c.get('user');
        const sql = c.get('sql');
        const productId = c.req.param('productId');

        if (!UUID_REGEX.test(productId)) {
            return c.json({ error: 'Invalid product ID format' }, 400);
        }

        const [existing] = await sql`
      SELECT id FROM wishlist 
      WHERE user_id = ${user.id} AND product_id = ${productId}
    `;

        return c.json({ inWishlist: !!existing });
    } catch (error) {
        console.error('Wishlist check error:', error.message);
        return c.json({ error: 'Failed to check wishlist' }, 500);
    }
});
