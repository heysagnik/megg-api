import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { expandQuery, OCCASION_MAP, getRelatedColors } from '../lib/searchMappings.js';

export const search = new Hono();

const TYPO_CORRECTIONS = {
    'tshirt': 't-shirt', 'teeshirt': 't-shirt', 'tee': 't-shirt',
    'hoody': 'hoodie', 'hoddie': 'hoodie', 'hoodi': 'hoodie',
    'runing': 'running', 'runnig': 'running',
    'addidas': 'adidas', 'adiddas': 'adidas',
    'niike': 'nike', 'nkie': 'nike',
    'causal': 'casual', 'formall': 'formal',
    'sneekers': 'sneakers', 'sneeker': 'sneaker', 'snikers': 'sneakers',
    'sheos': 'shoes', 'shooes': 'shoes',
    'jackt': 'jacket', 'jcket': 'jacket',
    'sweter': 'sweater', 'swetar': 'sweater',
    'jeens': 'jeans', 'jens': 'jeans',
};

function correctTypos(query) {
    if (!query) return query;
    return query.toLowerCase().split(/\s+/).map(word => TYPO_CORRECTIONS[word] || word).join(' ');
}

search.get('/', async (c) => {
    try {
        const rawQuery = c.req.query('query') || '';
        const category = c.req.query('category');
        const subcategory = c.req.query('subcategory');
        const color = c.req.query('color');
        const brand = c.req.query('brand');
        const sort = c.req.query('sort') || 'popularity';
        const page = Math.max(1, parseInt(c.req.query('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));

        if (!rawQuery?.trim() && !category && !subcategory && !color && !brand) {
            return c.json({ products: [], banners: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty', filters: {}, metadata: {} });
        }

        const query = correctTypos(rawQuery);
        const cacheKey = `search:v2:${query}:${category}:${color}:${brand}:${sort}:${page}`;
        const cached = await c.env.CACHE.get(cacheKey, 'json');
        if (cached) return c.json(cached);

        let embedding = null;
        if (query.length >= 3 && c.env.AI) {
            try {
                const embResponse = await c.env.AI.run(c.env.EMBEDDING_MODEL || '@cf/baai/bge-small-en-v1.5', { text: [query] });
                if (embResponse?.data?.[0]) embedding = embResponse.data[0];
            } catch (e) {
                console.error('Embedding failed:', e);
            }
        }

        const sql = neon(c.env.DATABASE_URL);
        const parsed = query ? expandQuery(query) : {};

        const filters = {
            category: category || parsed.category,
            subcategory: subcategory || parsed.subcategory,
            color: color || parsed.color,
            brand: brand || parsed.brand,
            occasion: parsed.occasion,
        };

        let result;
        if (embedding && parsed.confidence >= 1) {
            result = await hybridSearch(sql, { query, embedding, filters, page, limit, sort, parsed });
        } else if (parsed.confidence >= 2 || filters.category || filters.color || filters.brand) {
            result = await strictSearch(sql, { query, filters, page, limit, sort, parsed });
        } else if (query) {
            result = await textSearch(sql, { query, filters, page, limit, sort });
        } else {
            result = await browseSearch(sql, { filters, page, limit, sort });
        }

        if (result.products.length === 0 && parsed.confidence >= 1) {
            result = await fallbackSearch(sql, { query, filters, page, limit });
        }

        const banners = filters.category
            ? await sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [filters.category])
            : [];

        const response = {
            ...result,
            banners,
            filters: {
                appliedCategory: filters.category,
                appliedSubcategory: filters.subcategory,
                appliedColor: filters.color,
                appliedBrand: filters.brand,
                appliedSort: sort,
            },
            metadata: { query, parsed: { confidence: parsed.confidence, isCompound: parsed.isCompound } },
        };

        await c.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });
        return c.json(response);
    } catch (error) {
        console.error('Search error:', error);
        return c.json({ error: 'Search failed', message: error.message }, 500);
    }
});

async function strictSearch(sql, { query, filters, page, limit, sort, parsed }) {
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    const conditions = ['is_active = true'];
    const scoreTerms = ['popularity * 0.01'];

    if (filters.category) {
        conditions.push(`category::text ILIKE $${idx++}`);
        params.push(`%${filters.category}%`);
        scoreTerms.push(`CASE WHEN category::text ILIKE $${params.length} THEN 10 ELSE 0 END`);
    }

    if (filters.subcategory) {
        conditions.push(`subcategory::text ILIKE $${idx++}`);
        params.push(`%${filters.subcategory}%`);
        scoreTerms.push(`CASE WHEN subcategory::text ILIKE $${params.length} THEN 8 ELSE 0 END`);
    }

    if (filters.color) {
        const colorIdx = idx++;
        const relatedColors = getRelatedColors(filters.color);
        conditions.push(`(color ILIKE $${colorIdx} OR color ILIKE $${idx++})`);
        params.push(`%${filters.color}%`);
        params.push(relatedColors.length > 0 ? `%${relatedColors[0]}%` : `%${filters.color}%`);
        scoreTerms.push(`CASE WHEN LOWER(color) = LOWER($${colorIdx}) THEN 10 ELSE 5 END`);
    }

    if (filters.brand) {
        conditions.push(`brand ILIKE $${idx++}`);
        params.push(`%${filters.brand}%`);
        scoreTerms.push(`CASE WHEN brand ILIKE $${params.length} THEN 10 ELSE 0 END`);
    }

    if (parsed.occasion && OCCASION_MAP[parsed.occasion] && !filters.category) {
        const occasionCategories = OCCASION_MAP[parsed.occasion].categories;
        conditions.push(`category::text = ANY($${idx++}::text[])`);
        params.push(occasionCategories);
    }

    if (query && query.length > 2) {
        const queryIdx = idx++;
        const patternIdx = idx++;
        params.push(query, `%${query}%`);
        scoreTerms.push(`CASE WHEN search_vector @@ plainto_tsquery('english', $${queryIdx}) THEN 4 ELSE 0 END`);
        scoreTerms.push(`CASE WHEN name ILIKE $${patternIdx} THEN 5 ELSE 0 END`);
    }

    params.push(limit, offset);
    const limitIdx = idx++;
    const offsetIdx = idx++;

    const orderBy = sort === 'price_asc' ? 'price ASC'
        : sort === 'price_desc' ? 'price DESC'
            : sort === 'newest' ? 'created_at DESC'
                : 'score DESC, popularity DESC';

    const results = await sql(`
    SELECT *, (${scoreTerms.join(' + ')}) AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, params);

    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;
    return { products: results, total, page, limit, totalPages: Math.ceil(total / limit), searchMode: 'strict' };
}

async function textSearch(sql, { query, filters, page, limit, sort }) {
    const offset = (page - 1) * limit;
    const params = [query, `%${query}%`, limit, offset];

    let filterConditions = '';
    let paramIdx = 5;

    if (filters.category) {
        filterConditions += ` AND category::text ILIKE $${paramIdx++}`;
        params.push(`%${filters.category}%`);
    }
    if (filters.color) {
        filterConditions += ` AND color ILIKE $${paramIdx++}`;
        params.push(`%${filters.color}%`);
    }
    if (filters.brand) {
        filterConditions += ` AND brand ILIKE $${paramIdx++}`;
        params.push(`%${filters.brand}%`);
    }

    const orderBy = sort === 'price_asc' ? 'price ASC'
        : sort === 'price_desc' ? 'price DESC'
            : sort === 'newest' ? 'created_at DESC'
                : 'score DESC';

    const results = await sql(`
    SELECT *, 
      (
        CASE WHEN search_vector @@ plainto_tsquery('english', $1) THEN 5 ELSE 0 END +
        CASE WHEN name ILIKE $2 THEN 4 ELSE 0 END +
        CASE WHEN brand ILIKE $2 THEN 3 ELSE 0 END +
        CASE WHEN category::text ILIKE $2 THEN 2 ELSE 0 END +
        popularity * 0.01
      ) AS score,
      COUNT(*) OVER() as full_count
    FROM products
    WHERE is_active = true
      AND (
        search_vector @@ plainto_tsquery('english', $1)
        OR name ILIKE $2
        OR brand ILIKE $2
        OR category::text ILIKE $2
        OR subcategory::text ILIKE $2
      )
      ${filterConditions}
    ORDER BY ${orderBy}
    LIMIT $3 OFFSET $4
  `, params);

    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;
    return { products: results, total, page, limit, totalPages: Math.ceil(total / limit), searchMode: 'text' };
}

async function browseSearch(sql, { filters, page, limit, sort }) {
    const offset = (page - 1) * limit;
    const params = [];
    let idx = 1;
    const conditions = ['is_active = true'];

    if (filters.category) {
        conditions.push(`category::text ILIKE $${idx++}`);
        params.push(`%${filters.category}%`);
    }
    if (filters.subcategory) {
        conditions.push(`subcategory::text ILIKE $${idx++}`);
        params.push(`%${filters.subcategory}%`);
    }
    if (filters.color) {
        conditions.push(`color ILIKE $${idx++}`);
        params.push(`%${filters.color}%`);
    }
    if (filters.brand) {
        conditions.push(`brand ILIKE $${idx++}`);
        params.push(`%${filters.brand}%`);
    }

    params.push(limit, offset);
    const limitIdx = idx++;
    const offsetIdx = idx++;

    const orderBy = sort === 'price_asc' ? 'price ASC'
        : sort === 'price_desc' ? 'price DESC'
            : sort === 'newest' ? 'created_at DESC'
                : 'popularity DESC';

    const results = await sql(`
    SELECT *, popularity AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, params);

    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;
    return { products: results, total, page, limit, totalPages: Math.ceil(total / limit), searchMode: 'browse' };
}

async function fallbackSearch(sql, { query, filters, page, limit }) {
    const offset = (page - 1) * limit;
    const params = [`%${query}%`, limit, offset];

    let conditions = 'is_active = true AND (name ILIKE $1 OR brand ILIKE $1 OR description ILIKE $1)';
    let paramIdx = 4;

    if (filters.category) {
        conditions += ` AND category::text ILIKE $${paramIdx++}`;
        params.push(`%${filters.category}%`);
    }
    if (filters.color) {
        conditions += ` AND color ILIKE $${paramIdx++}`;
        params.push(`%${filters.color}%`);
    }

    const results = await sql(`
    SELECT *, popularity AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions}
    ORDER BY popularity DESC
    LIMIT $2 OFFSET $3
  `, params);

    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;
    return { products: results, total, page, limit, totalPages: Math.ceil(total / limit), searchMode: 'fallback' };
}

async function hybridSearch(sql, { query, embedding, filters, page, limit, sort, parsed }) {
    const offset = (page - 1) * limit;
    const vectorStr = `[${embedding.join(',')}]`;

    const sqlParams = [vectorStr, query];
    const vectorConditions = ['embedding IS NOT NULL', 'is_active = true'];
    const textConditions = ['is_active = true'];
    let paramIdx = 3;

    if (filters.category) {
        vectorConditions.push(`category::text ILIKE $${paramIdx}`);
        textConditions.push(`category::text ILIKE $${paramIdx}`);
        sqlParams.push(`%${filters.category}%`);
        paramIdx++;
    }
    if (filters.color) {
        vectorConditions.push(`color ILIKE $${paramIdx}`);
        textConditions.push(`color ILIKE $${paramIdx}`);
        sqlParams.push(`%${filters.color}%`);
        paramIdx++;
    }
    if (filters.brand) {
        vectorConditions.push(`brand ILIKE $${paramIdx}`);
        textConditions.push(`brand ILIKE $${paramIdx}`);
        sqlParams.push(`%${filters.brand}%`);
        paramIdx++;
    }

    const limitIdx = paramIdx;
    const offsetIdx = paramIdx + 1;
    sqlParams.push(limit, offset);

    const orderBy = sort === 'price_asc' ? 'p.price ASC'
        : sort === 'price_desc' ? 'p.price DESC'
            : sort === 'newest' ? 'p.created_at DESC'
                : 'combined_score DESC';

    try {
        const results = await sql(`
      WITH vector_scores AS (
        SELECT id, 1 - (embedding <=> $1::vector) AS vector_score
        FROM products
        WHERE ${vectorConditions.join(' AND ')}
        ORDER BY embedding <=> $1::vector
        LIMIT 100
      ),
      text_scores AS (
        SELECT id, ts_rank(search_vector, plainto_tsquery('english', $2)) AS text_score
        FROM products
        WHERE search_vector @@ plainto_tsquery('english', $2)
          AND ${textConditions.join(' AND ')}
      )
      SELECT 
        p.*,
        COALESCE(v.vector_score, 0) * 0.6 + 
        COALESCE(t.text_score, 0) * 0.3 + 
        COALESCE(p.popularity, 0) * 0.001 AS combined_score,
        COUNT(*) OVER() as full_count
      FROM products p
      LEFT JOIN vector_scores v ON p.id = v.id
      LEFT JOIN text_scores t ON p.id = t.id
      WHERE p.is_active = true
        AND (v.id IS NOT NULL OR t.id IS NOT NULL)
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, sqlParams);

        const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;
        return { products: results, total, page, limit, totalPages: Math.ceil(total / limit), searchMode: 'hybrid' };
    } catch (e) {
        console.error('Hybrid search error:', e);
        return strictSearch(sql, { query, filters, page, limit, sort, parsed });
    }
}
