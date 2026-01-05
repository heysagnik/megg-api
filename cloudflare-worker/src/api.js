import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';
import { auth } from './routes/auth.js';
import { wishlist } from './routes/wishlist.js';
import { search } from './routes/search.js';
import { handleImageOptimization } from './imageOptimizer.js';

const app = new Hono();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_SORTS = {
  popularity: 'popularity DESC',
  newest: 'created_at DESC',
  price_low: 'price ASC',
  price_high: 'price DESC'
};

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

const getDB = (env) => neon(env.DATABASE_URL);

const validatePagination = (pageStr, limitStr) => {
  const page = Math.max(1, parseInt(pageStr) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitStr) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

app.route('/api/auth', auth);
app.route('/api/wishlist', wishlist);
// Search is proxied to Vercel due to SQL compatibility issues
// app.route('/api/search', search);

app.get('/api/optimize', async (c) => {
  return handleImageOptimization(c.req.raw, c.env);
});

app.get('/api/health', (c) => c.json({ status: 'ok', service: 'workers', timestamp: new Date().toISOString() }));

app.get('/api/products', async (c) => {
  try {
    const { category, subcategory, sort = 'popularity' } = c.req.query();
    const { page, limit, offset } = validatePagination(c.req.query('page'), c.req.query('limit'));

    const orderBy = VALID_SORTS[sort] || VALID_SORTS.popularity;
    const cacheKey = `products:${category || 'all'}:${subcategory || 'all'}:${page}:${sort}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let products;
    if (category && subcategory) {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products 
        WHERE is_active = true AND category = ${category} AND subcategory = ${subcategory}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category) {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products 
        WHERE is_active = true AND category = ${category}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products 
        WHERE is_active = true
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const result = { products, page, limit };
    await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 900 });

    return c.json(result);
  } catch (error) {
    console.error('Products fetch error:', error.message);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/api/products/browse/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const { subcategory, color, sort = 'popularity' } = c.req.query();
    const { page, limit, offset } = validatePagination(c.req.query('page'), c.req.query('limit'));

    const cacheKey = `browse:${category}:${subcategory || 'all'}:${color || 'all'}:${page}:${sort}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let products;
    if (subcategory && color) {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products
        WHERE is_active = true AND category::text = ${category} AND subcategory::text = ${subcategory} AND color ILIKE ${`%${color}%`}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (subcategory) {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products
        WHERE is_active = true AND category::text = ${category} AND subcategory::text = ${subcategory}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (color) {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products
        WHERE is_active = true AND category::text = ${category} AND color ILIKE ${`%${color}%`}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      products = await sql`
        SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, popularity
        FROM products
        WHERE is_active = true AND category::text = ${category}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const banners = await sql`
      SELECT id, banner_image, link, display_order
      FROM category_banners
      WHERE category::text = ${category}
      ORDER BY display_order ASC
    `;

    const result = {
      category,
      banners: banners || [],
      products: products || [],
      page,
      limit,
      appliedFilters: { subcategory, color, sort }
    };

    await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 900 });
    return c.json(result);
  } catch (error) {
    console.error('Browse fetch error:', error.message);
    return c.json({ error: 'Failed to browse products' }, 500);
  }
});

app.get('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid product ID format' }, 400);
    }

    const sql = getDB(c.env);
    const [product] = await sql`SELECT * FROM products WHERE id = ${id}`;

    if (!product) return c.json({ error: 'Product not found' }, 404);
    return c.json(product);
  } catch (error) {
    console.error('Product fetch error:', error.message);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

app.get('/api/products/:id/recommendations', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid product ID format' }, 400);
    }

    const sql = getDB(c.env);
    const [product] = await sql`SELECT subcategory, category FROM products WHERE id = ${id}`;

    if (!product) return c.json({ error: 'Product not found' }, 404);

    let recommendations;
    if (product.subcategory) {
      recommendations = await sql`
        SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link, popularity
        FROM products
        WHERE id != ${id}
        AND subcategory::text = ${product.subcategory}::text
        ORDER BY popularity DESC
        LIMIT 12
      `;
    } else {
      recommendations = await sql`
        SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link, popularity
        FROM products
        WHERE id != ${id}
        AND category::text = ${product.category}::text
        ORDER BY popularity DESC
        LIMIT 12
      `;
    }

    return c.json({ products: recommendations });
  } catch (error) {
    console.error('Recommendations fetch error:', error.message);
    return c.json({ error: 'Failed to fetch recommendations' }, 500);
  }
});

app.get('/api/products/:id/variants', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid product ID format' }, 400);
    }

    const sql = getDB(c.env);
    const [product] = await sql`SELECT name, brand, subcategory, category FROM products WHERE id = ${id}`;

    if (!product) return c.json({ error: 'Product not found' }, 404);

    let variants;
    if (product.subcategory) {
      variants = await sql`
        SELECT id, name, price, brand, images, color, category, subcategory
        FROM products
        WHERE brand = ${product.brand}
        AND name ILIKE ${product.name}
        AND id != ${id}
        AND subcategory::text = ${product.subcategory}::text
        LIMIT 10
      `;
    } else {
      variants = await sql`
        SELECT id, name, price, brand, images, color, category, subcategory
        FROM products
        WHERE brand = ${product.brand}
        AND name ILIKE ${product.name}
        AND id != ${id}
        AND category::text = ${product.category}::text
        LIMIT 10
      `;
    }

    return c.json({ variants: variants || [] });
  } catch (error) {
    console.error('Variants fetch error:', error.message);
    return c.json({ error: 'Failed to fetch variants' }, 500);
  }
});

app.get('/api/categories', async (c) => {
  try {
    const cached = await c.env.CACHE.get('categories:all', 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const categories = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category
    `;

    await c.env.CACHE.put('categories:all', JSON.stringify(categories), { expirationTtl: 3600 });
    return c.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error.message);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

app.get('/api/reels', async (c) => {
  try {
    const { category } = c.req.query();
    const cacheKey = `reels:${category || 'all'}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let reels;
    if (category) {
      reels = await sql`
        SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
        FROM reels WHERE category = ${category}
        ORDER BY created_at DESC
      `;
    } else {
      reels = await sql`
        SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
        FROM reels ORDER BY created_at DESC
      `;
    }

    await c.env.CACHE.put(cacheKey, JSON.stringify(reels), { expirationTtl: 900 });
    return c.json(reels);
  } catch (error) {
    console.error('Reels fetch error:', error.message);
    return c.json({ error: 'Failed to fetch reels' }, 500);
  }
});

app.get('/api/reels/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid reel ID format' }, 400);
    }

    const sql = getDB(c.env);
    const [reel] = await sql`SELECT * FROM reels WHERE id = ${id}`;

    if (!reel) return c.json({ error: 'Reel not found' }, 404);

    if (reel.product_ids && reel.product_ids.length > 0) {
      const products = await sql`
        SELECT id, name, price, brand, images, category, color, affiliate_link
        FROM products WHERE id = ANY(${reel.product_ids})
      `;
      return c.json({ reel, products });
    }

    return c.json({ reel, products: [] });
  } catch (error) {
    console.error('Reel fetch error:', error.message);
    return c.json({ error: 'Failed to fetch reel' }, 500);
  }
});

app.get('/api/color-combos', async (c) => {
  try {
    const { group_type } = c.req.query();
    const cacheKey = `color-combos:${group_type || 'all'}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let combos;
    if (group_type) {
      combos = await sql`
        SELECT id, name, model_image, product_ids, color_a, color_b, color_c, group_type
        FROM color_combos WHERE group_type = ${group_type}
        ORDER BY name
      `;
    } else {
      combos = await sql`
        SELECT id, name, model_image, product_ids, color_a, color_b, color_c, group_type
        FROM color_combos ORDER BY name
      `;
    }

    await c.env.CACHE.put(cacheKey, JSON.stringify(combos), { expirationTtl: 200 }); // TODO: Change this to 3600
    return c.json(combos);
  } catch (error) {
    console.error('Color combos fetch error:', error.message);
    return c.json({ error: 'Failed to fetch color combos' }, 500);
  }
});

app.get('/api/color-combos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid color combo ID format' }, 400);
    }

    const sql = getDB(c.env);
    const [combo] = await sql`SELECT * FROM color_combos WHERE id = ${id}`;

    if (!combo) return c.json({ error: 'Color combo not found' }, 404);

    if (combo.product_ids && combo.product_ids.length > 0) {
      const products = await sql`
        SELECT id, name, price, brand, images, category, color, affiliate_link
        FROM products WHERE id = ANY(${combo.product_ids})
      `;
      return c.json({ combo, products });
    }

    return c.json({ combo, products: [] });
  } catch (error) {
    console.error('Color combo fetch error:', error.message);
    return c.json({ error: 'Failed to fetch color combo' }, 500);
  }
});

app.get('/api/offers', async (c) => {
  try {
    const cached = await c.env.CACHE.get('offers:all', 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const offers = await sql`
      SELECT id, title, banner_image, affiliate_link
      FROM offers ORDER BY created_at DESC
    `;

    await c.env.CACHE.put('offers:all', JSON.stringify(offers), { expirationTtl: 900 });
    return c.json(offers);
  } catch (error) {
    console.error('Offers fetch error:', error.message);
    return c.json({ error: 'Failed to fetch offers' }, 500);
  }
});

app.get('/api/trending', async (c) => {
  try {
    const limitParam = parseInt(c.req.query('limit')) || 10;
    const limit = Math.min(50, Math.max(1, limitParam));
    const cacheKey = `trending:${limit}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const products = await sql`
      SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, clicks, popularity
      FROM products
      WHERE is_active = true
      ORDER BY clicks DESC
      LIMIT ${limit}
    `;

    await c.env.CACHE.put(cacheKey, JSON.stringify(products), { expirationTtl: 300 });
    return c.json(products);
  } catch (error) {
    console.error('Trending fetch error:', error.message);
    return c.json({ error: 'Failed to fetch trending products' }, 500);
  }
});

app.get('/api/banners', async (c) => {
  try {
    const { category } = c.req.query();
    const cacheKey = `banners:${category || 'all'}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let banners;
    if (category) {
      banners = await sql`
        SELECT * FROM category_banners WHERE category = ${category}
        ORDER BY display_order
      `;
    } else {
      banners = await sql`
        SELECT * FROM category_banners ORDER BY display_order
      `;
    }

    await c.env.CACHE.put(cacheKey, JSON.stringify(banners), { expirationTtl: 3600 });
    return c.json(banners);
  } catch (error) {
    console.error('Banners fetch error:', error.message);
    return c.json({ error: 'Failed to fetch banners' }, 500);
  }
});

app.all('/api/upload/*', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    return fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? await c.req.arrayBuffer() : undefined
    });
  } catch (error) {
    console.error('Upload proxy error:', error.message);
    return c.json({ error: 'Upload service unavailable' }, 502);
  }
});

app.all('/api/admin/*', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    return fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? await c.req.text() : undefined
    });
  } catch (error) {
    console.error('Admin proxy error:', error.message);
    return c.json({ error: 'Admin service unavailable' }, 502);
  }
});

app.all('/api/outfits', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '');
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Outfits proxy error:', error.message);
    return c.json({ error: 'Outfits service unavailable' }, 502);
  }
});

app.all('/api/outfits/:id', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Outfits proxy error:', error.message);
    return c.json({ error: 'Outfits service unavailable' }, 502);
  }
});

// Proxy FCM to Vercel
app.all('/api/fcm', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('FCM proxy error:', error.message);
    return c.json({ error: 'FCM service unavailable' }, 502);
  }
});

// Proxy notifications to Vercel
app.all('/api/notifications', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Notifications proxy error:', error.message);
    return c.json({ error: 'Notifications service unavailable' }, 502);
  }
});

// Proxy search to Vercel (complex SQL queries work better there)
app.all('/api/search', async (c) => {
  try {
    const url = new URL(c.req.url);
    const vercelUrl = c.env.ORIGIN_URL + '/api/search' + url.search;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Search proxy error:', error.message);
    return c.json({ error: 'Search service unavailable' }, 502);
  }
});

app.notFound((c) => c.json({ error: 'Endpoint not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
