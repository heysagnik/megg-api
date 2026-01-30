import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';
import { auth } from './routes/auth.js';
import { wishlist } from './routes/wishlist.js';
import { handleImageOptimization } from './imageOptimizer.js';

const app = new Hono();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CACHE_TTL = {
  PRODUCT_DETAIL: 1800,
  PRODUCT_LIST: 900,
  RECOMMENDATIONS: 1800,
  VARIANTS: 1800,
  CATEGORIES: 3600,
  SUBCATEGORIES: 3600,
  REELS: 900,
  REEL_DETAIL: 900,
  COLOR_COMBOS: 3600,
  COMBO_DETAIL: 3600,
  OFFERS: 900,
  TRENDING: 300,
  BANNERS: 3600,
  SEARCH: 60
};

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

app.get('/api/optimize', async (c) => {
  return handleImageOptimization(c.req.raw, c.env);
});

app.get('/api/health', (c) => c.json({ status: 'ok', service: 'workers', timestamp: new Date().toISOString() }));

app.get('/api/products', async (c) => {
  try {
    const { category, subcategory, sort = 'popularity' } = c.req.query();
    const { page, limit, offset } = validatePagination(c.req.query('page'), c.req.query('limit'));

    const cacheKey = `products:${category || 'all'}:${subcategory || 'all'}:${page}:${limit}:${sort}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let products;
    if (category && subcategory) {
      products = await sql`
        SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link, popularity
        FROM products 
        WHERE is_active = true AND category = ${category} AND subcategory = ${subcategory}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category) {
      products = await sql`
        SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link, popularity
        FROM products 
        WHERE is_active = true AND category = ${category}
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      products = await sql`
        SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link, popularity
        FROM products 
        WHERE is_active = true
        ORDER BY popularity DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const result = { products, page, limit };
    
    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.PRODUCT_LIST })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.get('/api/products/browse/:category', async (c) => {
  try {
    const category = c.req.param('category');
    const { subcategory, color, sort = 'popularity' } = c.req.query();
    const { page, limit, offset } = validatePagination(c.req.query('page'), c.req.query('limit'));

    const cacheKey = `browse:${category}:${subcategory || 'all'}:${color || 'all'}:${page}:${limit}:${sort}`;

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

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.PRODUCT_LIST })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to browse products' }, 500);
  }
});

app.get('/api/products/brand/:brand', async (c) => {
  try {
    const brand = c.req.param('brand');
    const { category, subcategory, color, sort = 'popularity' } = c.req.query();
    const { page, limit, offset } = validatePagination(c.req.query('page'), c.req.query('limit'));

    const colorFilters = color ? color.split(',').map(c => c.trim()).filter(Boolean) : [];
    const cacheKey = `brand:${brand}:${category || 'all'}:${subcategory || 'all'}:${colorFilters.join(',') || 'all'}:${page}:${limit}:${sort}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    const conditions = ['is_active = true', 'brand ILIKE $1'];
    const params = [`%${brand}%`];
    let paramIdx = 2;

    if (category) {
      conditions.push(`category::text ILIKE $${paramIdx++}`);
      params.push(`%${category}%`);
    }
    if (subcategory) {
      conditions.push(`subcategory::text ILIKE $${paramIdx++}`);
      params.push(`%${subcategory}%`);
    }
    if (colorFilters.length > 0) {
      const colorConditions = colorFilters.map(() => `color ILIKE $${paramIdx++}`);
      params.push(...colorFilters.map(c => `%${c}%`));
      conditions.push(`(${colorConditions.join(' OR ')})`);
    }

    const limitIdx = paramIdx++;
    const offsetIdx = paramIdx++;
    params.push(limit, offset);

    const orderBy = sort === 'price_asc' ? 'price ASC'
      : sort === 'price_desc' ? 'price DESC'
        : sort === 'newest' ? 'created_at DESC'
          : 'popularity DESC';

    const whereClause = conditions.join(' AND ');
    const countParams = params.slice(0, paramIdx - 2);

    const [products, categories, subcategories, colors, totalCount] = await Promise.all([
      sql(
        `SELECT id, name, price, brand, images, category::text as category, subcategory::text as subcategory, color, affiliate_link, popularity
         FROM products
         WHERE ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
      ),

      sql(
        `SELECT category::text as name, COUNT(*)::int as count
         FROM products
         WHERE is_active = true AND brand ILIKE $1
         GROUP BY category
         ORDER BY count DESC`,
        [`%${brand}%`]
      ),

      category ? sql(
        `SELECT subcategory::text as name, COUNT(*)::int as count
         FROM products
         WHERE is_active = true AND brand ILIKE $1 AND category::text ILIKE $2
         GROUP BY subcategory
         HAVING subcategory IS NOT NULL AND subcategory::text != ''
         ORDER BY count DESC
         LIMIT 30`,
        [`%${brand}%`, `%${category}%`]
      ) : Promise.resolve([]),

      category ? sql(
        `SELECT TRIM(color) as name, COUNT(*)::int as count
         FROM products
         WHERE is_active = true AND brand ILIKE $1 AND category::text ILIKE $2
         GROUP BY TRIM(color)
         HAVING TRIM(color) IS NOT NULL AND TRIM(color) != ''
         ORDER BY count DESC
         LIMIT 30`,
        [`%${brand}%`, `%${category}%`]
      ) : sql(
        `SELECT TRIM(color) as name, COUNT(*)::int as count
         FROM products
         WHERE is_active = true AND brand ILIKE $1
         GROUP BY TRIM(color)
         HAVING TRIM(color) IS NOT NULL AND TRIM(color) != ''
         ORDER BY count DESC
         LIMIT 30`,
        [`%${brand}%`]
      ),

      sql(
        `SELECT COUNT(*)::int as count
         FROM products
         WHERE ${whereClause}`,
        countParams
      )
    ]);

    const total = totalCount[0]?.count || 0;

    const result = {
      brand,
      products: products || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      availableFilters: {
        categories: categories || [],
        subcategories: subcategories || [],
        colors: colors || []
      },
      appliedFilters: {
        category: category || null,
        subcategory: subcategory || null,
        colors: colorFilters,
        sort
      }
    };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.PRODUCT_LIST })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch brand products' }, 500);
  }
});

app.get('/api/products/brands', async (c) => {
  try {
    const cacheKey = 'brands:all';
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const brands = await sql`
      SELECT 
        brand as name,
        COUNT(*)::int as product_count,
        MIN(price)::numeric as min_price,
        MAX(price)::numeric as max_price,
        json_agg(DISTINCT category::text) as categories
      FROM products
      WHERE is_active = true AND brand IS NOT NULL AND brand != ''
      GROUP BY brand
      HAVING COUNT(*) > 0
      ORDER BY product_count DESC, brand ASC
    `;

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(brands), { expirationTtl: CACHE_TTL.CATEGORIES })
    );

    return c.json(brands);
  } catch (error) {
    return c.json({ error: 'Failed to fetch brands' }, 500);
  }
});

app.get('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid product ID format' }, 400);
    }

    const cacheKey = `product:${id}`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const [product] = await sql`
      SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link, is_active, clicks, popularity
      FROM products WHERE id = ${id}
    `;

    if (!product) return c.json({ error: 'Product not found' }, 404);

    const [variants, recommended] = await Promise.all([
      sql`
        SELECT id, color, images
        FROM products
        WHERE brand = ${product.brand}
        AND name ILIKE ${product.name}
        AND id != ${id}
        AND is_active = true
        LIMIT 10
      `,
      product.subcategory
        ? sql`
            SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link
            FROM products
            WHERE id != ${id}
            AND is_active = true
            AND subcategory::text = ${product.subcategory}
            ORDER BY popularity DESC
            LIMIT 8
          `
        : sql`
            SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link
            FROM products
            WHERE id != ${id}
            AND is_active = true
            AND category::text = ${product.category}
            ORDER BY popularity DESC
            LIMIT 8
          `
    ]);

    sql`UPDATE products SET popularity = popularity + 1 WHERE id = ${id}`.catch(() => {});

    const result = { product, variants: variants || [], recommended: recommended || [] };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.PRODUCT_DETAIL })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

app.get('/api/products/:id/recommendations', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid product ID format' }, 400);
    }

    const cacheKey = `product:${id}:recs`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const [product] = await sql`SELECT subcategory, category FROM products WHERE id = ${id}`;

    if (!product) return c.json({ error: 'Product not found' }, 404);

    const recommendations = product.subcategory
      ? await sql`
          SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link, popularity
          FROM products
          WHERE id != ${id}
          AND is_active = true
          AND subcategory::text = ${product.subcategory}
          ORDER BY popularity DESC
          LIMIT 12
        `
      : await sql`
          SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link, popularity
          FROM products
          WHERE id != ${id}
          AND is_active = true
          AND category::text = ${product.category}
          ORDER BY popularity DESC
          LIMIT 12
        `;

    const result = { products: recommendations };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.RECOMMENDATIONS })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch recommendations' }, 500);
  }
});

app.get('/api/products/:id/variants', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid product ID format' }, 400);
    }

    const cacheKey = `product:${id}:variants`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const [product] = await sql`SELECT name, brand, subcategory, category FROM products WHERE id = ${id}`;

    if (!product) return c.json({ error: 'Product not found' }, 404);

    const variants = product.subcategory
      ? await sql`
          SELECT id, name, price, brand, images, color, category, subcategory
          FROM products
          WHERE brand = ${product.brand}
          AND name ILIKE ${product.name}
          AND id != ${id}
          AND is_active = true
          AND subcategory::text = ${product.subcategory}
          LIMIT 10
        `
      : await sql`
          SELECT id, name, price, brand, images, color, category, subcategory
          FROM products
          WHERE brand = ${product.brand}
          AND name ILIKE ${product.name}
          AND id != ${id}
          AND is_active = true
          AND category::text = ${product.category}
          LIMIT 10
        `;

    const result = { variants: variants || [] };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.VARIANTS })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch variants' }, 500);
  }
});

app.get('/api/categories', async (c) => {
  try {
    const cacheKey = 'categories:all';
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const categories = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category
    `;

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(categories), { expirationTtl: CACHE_TTL.CATEGORIES })
    );

    return c.json(categories);
  } catch (error) {
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

app.get('/api/subcategories/:category', async (c) => {
  try {
    const category = c.req.param('category');
    if (!category || category.length > 50) {
      return c.json({ error: 'Invalid category' }, 400);
    }

    const cacheKey = `subcategories:${category}`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json({ success: true, data: cached });

    const sql = getDB(c.env);

    const results = await sql`
      SELECT id, name, category, display_order, is_active
      FROM subcategories
      WHERE category = ${category} AND is_active = true
      ORDER BY display_order, name
    `;

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: CACHE_TTL.SUBCATEGORIES })
    );

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ error: 'Failed to fetch subcategories' }, 500);
  }
});

app.get('/api/reels', async (c) => {
  try {
    const { category } = c.req.query();
    const cacheKey = `reels:${category || 'all'}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    const reels = category
      ? await sql`
          SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
          FROM reels WHERE category = ${category}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
          FROM reels ORDER BY created_at DESC
        `;

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(reels), { expirationTtl: CACHE_TTL.REELS })
    );

    return c.json(reels);
  } catch (error) {
    return c.json({ error: 'Failed to fetch reels' }, 500);
  }
});

app.get('/api/reels/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid reel ID format' }, 400);
    }

    const cacheKey = `reel:${id}`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const [reel] = await sql`SELECT * FROM reels WHERE id = ${id}`;

    if (!reel) return c.json({ error: 'Reel not found' }, 404);

    let products = [];
    if (reel.product_ids && reel.product_ids.length > 0) {
      products = await sql`
        SELECT id, name, price, brand, images, category, color, affiliate_link
        FROM products WHERE id = ANY(${reel.product_ids})
      `;
    }

    const result = { reel, products };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.REEL_DETAIL })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch reel' }, 500);
  }
});

app.get('/api/color-combos', async (c) => {
  try {
    const { group_type, color_a, color_b } = c.req.query();
    const cacheKey = `color-combos:${group_type || 'all'}:${color_a || 'all'}:${color_b || 'all'}`;

    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);

    let combos = group_type
      ? await sql`
          SELECT id, name, model_image, product_ids, color_a, color_b, color_c, group_type
          FROM color_combos WHERE group_type = ${group_type}
          ORDER BY name
        `
      : await sql`
          SELECT id, name, model_image, product_ids, color_a, color_b, color_c, group_type
          FROM color_combos ORDER BY name
        `;

    if (combos) {
      if (color_a) combos = combos.filter(c => c.color_a === color_a);
      if (color_b) combos = combos.filter(c => c.color_b === color_b);
    }

    const meta = {
      colors: {
        a: [...new Set(combos?.map(c => c.color_a).filter(Boolean))].sort(),
        b: [...new Set(combos?.map(c => c.color_b).filter(Boolean))].sort(),
        c: [...new Set(combos?.map(c => c.color_c).filter(Boolean))].sort()
      }
    };

    const result = { combos: combos || [], meta };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.COLOR_COMBOS })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch color combos' }, 500);
  }
});

app.get('/api/color-combos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid color combo ID format' }, 400);
    }

    const cacheKey = `combo:${id}`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const [combo] = await sql`SELECT * FROM color_combos WHERE id = ${id}`;

    if (!combo) return c.json({ error: 'Color combo not found' }, 404);

    let products = [];
    if (combo.product_ids && combo.product_ids.length > 0) {
      products = await sql`
        SELECT id, name, price, brand, images, category, color, affiliate_link
        FROM products WHERE id = ANY(${combo.product_ids})
      `;
    }

    const result = { combo, products };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.COMBO_DETAIL })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch color combo' }, 500);
  }
});

app.get('/api/color-combos/:id/recommendations', async (c) => {
  try {
    const id = c.req.param('id');
    if (!UUID_REGEX.test(id)) {
      return c.json({ error: 'Invalid color combo ID format' }, 400);
    }

    const cacheKey = `combo:${id}:recs`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const [combo] = await sql`SELECT group_type FROM color_combos WHERE id = ${id}`;

    if (!combo) return c.json({ error: 'Color combo not found' }, 404);

    const recommendations = await sql`
      SELECT id, name, model_image, product_ids, color_a, color_b, color_c, group_type
      FROM color_combos 
      WHERE id != ${id} 
      AND group_type = ${combo.group_type}
      ORDER BY name
      LIMIT 10
    `;

    const result = { recommendations: recommendations || [] };

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL.COLOR_COMBOS })
    );

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Failed to fetch recommendations' }, 500);
  }
});

app.get('/api/offers', async (c) => {
  try {
    const cacheKey = 'offers:all';
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const sql = getDB(c.env);
    const offers = await sql`
      SELECT id, title, banner_image, affiliate_link
      FROM offers ORDER BY created_at DESC
    `;

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(offers), { expirationTtl: CACHE_TTL.OFFERS })
    );

    return c.json(offers);
  } catch (error) {
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

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(products), { expirationTtl: CACHE_TTL.TRENDING })
    );

    return c.json(products);
  } catch (error) {
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

    const banners = category
      ? await sql`
          SELECT * FROM category_banners WHERE category = ${category}
          ORDER BY display_order
        `
      : await sql`
          SELECT * FROM category_banners ORDER BY display_order
        `;

    c.executionCtx.waitUntil(
      c.env.CACHE.put(cacheKey, JSON.stringify(banners), { expirationTtl: CACHE_TTL.BANNERS })
    );

    return c.json(banners);
  } catch (error) {
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
    return c.json({ error: 'Admin service unavailable' }, 502);
  }
});

app.all('/api/outfits', async (c) => {
  try {
    const cacheKey = `outfits:list`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached && c.req.method === 'GET') return c.json(cached);

    const vercelUrl = c.env.ORIGIN_URL + c.req.path + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '');
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();

    if (c.req.method === 'GET' && response.ok) {
      c.executionCtx.waitUntil(
        c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL.REELS })
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'Outfits service unavailable' }, 502);
  }
});

app.all('/api/outfits/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const cacheKey = `outfit:${id}`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached && c.req.method === 'GET') return c.json(cached);

    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();

    if (c.req.method === 'GET' && response.ok) {
      c.executionCtx.waitUntil(
        c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL.REELS })
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'Outfits service unavailable' }, 502);
  }
});

app.all('/api/fcm', async (c) => {
  try {
    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? await c.req.text() : undefined
    });
    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'FCM service unavailable' }, 502);
  }
});

app.all('/api/notifications', async (c) => {
  try {
    const cacheKey = 'notifications:all';
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached && c.req.method === 'GET') return c.json(cached);

    const vercelUrl = c.env.ORIGIN_URL + c.req.path;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
    });
    const data = await response.json();

    if (c.req.method === 'GET' && response.ok) {
      c.executionCtx.waitUntil(
        c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'Notifications service unavailable' }, 502);
  }
});

app.get('/api/search/filters', async (c) => {
  try {
    const url = new URL(c.req.url);
    const cacheKey = `search:filters:${url.search}`;
    
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const vercelUrl = c.env.ORIGIN_URL + '/api/search/filters' + url.search;
    const response = await fetch(vercelUrl, {
      method: 'GET',
      headers: c.req.raw.headers,
    });
    const data = await response.json();

    if (response.ok) {
      c.executionCtx.waitUntil(
        c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL.SEARCH })
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'Filters service unavailable' }, 502);
  }
});

app.get('/api/search/suggestions', async (c) => {
  try {
    const url = new URL(c.req.url);
    const cacheKey = `search:suggestions:${url.search}`;
    
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const vercelUrl = c.env.ORIGIN_URL + '/api/search/suggestions' + url.search;
    const response = await fetch(vercelUrl, {
      method: 'GET',
      headers: c.req.raw.headers,
    });
    const data = await response.json();

    if (response.ok) {
      c.executionCtx.waitUntil(
        c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL.SEARCH })
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'Suggestions service unavailable' }, 502);
  }
});

app.all('/api/search', async (c) => {
  try {
    const url = new URL(c.req.url);
    const cacheKey = `search:v2:${url.search}`;
    
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    if (cached) return c.json(cached);

    const vercelUrl = c.env.ORIGIN_URL + '/api/search' + url.search;
    const response = await fetch(vercelUrl, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? await c.req.text() : undefined
    });
    const data = await response.json();

    if (response.ok) {
      c.executionCtx.waitUntil(
        c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: CACHE_TTL.SEARCH })
      );
    }

    return c.json(data, response.status);
  } catch (error) {
    return c.json({ error: 'Search service unavailable' }, 502);
  }
});

app.notFound((c) => c.json({ error: 'Endpoint not found' }, 404));

app.onError((err, c) => {
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
