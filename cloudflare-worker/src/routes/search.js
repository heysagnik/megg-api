import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { expandQuery, getRelatedColors, SUBCATEGORY_ALIASES } from '../lib/searchMappings.js';

export const search = new Hono();

const CACHE_TTL = 60;

const TYPO_CORRECTIONS = {
    'tshirt': 'tshirt', 'teeshirt': 'tshirt', 'tee': 'tshirt', 't-shirt': 'tshirt',
    'hoody': 'hoodie', 'hoddie': 'hoodie', 'hoodi': 'hoodie',
    'jackt': 'jacket', 'jcket': 'jacket',
    'sweter': 'sweater', 'swetar': 'sweater',
    'jeens': 'jeans', 'jens': 'jeans',
    'addidas': 'adidas', 'adiddas': 'adidas',
    'niike': 'nike', 'nkie': 'nike',
    'pumaa': 'puma', 'pumma': 'puma',
    'sneekers': 'sneakers', 'sneeker': 'sneaker', 'snikers': 'sneakers',
    'sheos': 'shoes', 'shooes': 'shoes',
    'runing': 'running', 'runnig': 'running',
    'causal': 'casual', 'formall': 'formal',
};

function correctTypos(query) {
    if (!query) return query;
    return query.toLowerCase().split(/\s+/).map(word => TYPO_CORRECTIONS[word] || word).join(' ');
}

function escapeForLike(str) {
    if (!str) return str;
    return str.replace(/[%_]/g, '\\$&');
}

async function getAvailableFilters(sql, filters, query) {
    const params = [];
    let idx = 1;
    const conditions = ['is_active = true'];

    if (filters.category) {
        conditions.push(`category::text ILIKE $${idx++}`);
        params.push(`%${escapeForLike(filters.category)}%`);
    }
    if (filters.subcategory) {
        conditions.push(`subcategory::text ILIKE $${idx++}`);
        params.push(`%${escapeForLike(filters.subcategory)}%`);
    }
    if (filters.color) {
        conditions.push(`color ILIKE $${idx++}`);
        params.push(`%${escapeForLike(filters.color)}%`);
    }
    if (filters.brand) {
        conditions.push(`brand ILIKE $${idx++}`);
        params.push(`%${escapeForLike(filters.brand)}%`);
    }
    if (query && query.length >= 2) {
        conditions.push(`(search_vector @@ plainto_tsquery('english', $${idx}) OR name ILIKE $${idx + 1} OR brand ILIKE $${idx + 1})`);
        params.push(query, `%${escapeForLike(query)}%`);
    }

    const whereClause = conditions.join(' AND ');

    const [categories, subcategories, colors, brands, priceRange] = await Promise.all([
        sql(`SELECT category::text as name, COUNT(*)::int as count FROM products WHERE ${whereClause} GROUP BY category ORDER BY count DESC`, params),
        sql(`SELECT subcategory::text as name, COUNT(*)::int as count FROM products WHERE ${whereClause} GROUP BY subcategory HAVING subcategory IS NOT NULL AND subcategory::text != '' ORDER BY count DESC LIMIT 30`, params),
        sql(`SELECT TRIM(color) as name, COUNT(*)::int as count FROM products WHERE ${whereClause} GROUP BY TRIM(color) HAVING TRIM(color) IS NOT NULL AND TRIM(color) != '' ORDER BY count DESC LIMIT 30`, params),
        sql(`SELECT brand as name, COUNT(*)::int as count FROM products WHERE ${whereClause} GROUP BY brand HAVING brand IS NOT NULL AND brand != '' ORDER BY count DESC LIMIT 50`, params),
        sql(`SELECT MIN(price)::numeric as min, MAX(price)::numeric as max FROM products WHERE ${whereClause}`, params)
    ]);

    return {
        categories: categories || [],
        subcategories: subcategories || [],
        colors: colors || [],
        brands: brands || [],
        priceRange: priceRange[0] || { min: 0, max: 0 }
    };
}

search.get('/filters', async (c) => {
    try {
        const rawQuery = c.req.query('query') || '';
        const category = c.req.query('category');
        const subcategory = c.req.query('subcategory');
        const color = c.req.query('color');
        const brand = c.req.query('brand');

        const query = correctTypos(rawQuery);
        const cacheKey = `filters:${query}:${category}:${subcategory}:${color}:${brand}`;

        const cached = await c.env.CACHE.get(cacheKey, 'json');
        if (cached) return c.json({ success: true, data: cached });

        const sql = neon(c.env.DATABASE_URL);
        const filters = { category, subcategory, color, brand };
        const availableFilters = await getAvailableFilters(sql, filters, query);

        c.executionCtx.waitUntil(
            c.env.CACHE.put(cacheKey, JSON.stringify(availableFilters), { expirationTtl: CACHE_TTL })
        );

        return c.json({ success: true, data: availableFilters });
    } catch (error) {
        return c.json({ success: false, error: 'Failed to fetch filters' }, 500);
    }
});

search.get('/suggestions', async (c) => {
    try {
        const rawQuery = c.req.query('query') || '';

        if (!rawQuery || rawQuery.length < 2) {
            return c.json({ success: true, data: { suggestions: [] } });
        }

        const cacheKey = `suggestions:${rawQuery}`;
        const cached = await c.env.CACHE.get(cacheKey, 'json');
        if (cached) return c.json({ success: true, data: cached });

        const sql = neon(c.env.DATABASE_URL);
        const pattern = `%${escapeForLike(rawQuery)}%`;

        const [products, brands, categories] = await Promise.all([
            sql(`SELECT DISTINCT name FROM products WHERE is_active = true AND name ILIKE $1 ORDER BY popularity DESC LIMIT 5`, [pattern]),
            sql(`SELECT DISTINCT brand as name, COUNT(*)::int as count FROM products WHERE is_active = true AND brand ILIKE $1 GROUP BY brand ORDER BY count DESC LIMIT 5`, [pattern]),
            sql(`SELECT DISTINCT category::text as name, COUNT(*)::int as count FROM products WHERE is_active = true AND category::text ILIKE $1 GROUP BY category ORDER BY count DESC LIMIT 5`, [pattern])
        ]);

        const result = {
            suggestions: [
                ...products.map(p => ({ type: 'product', value: p.name })),
                ...brands.map(b => ({ type: 'brand', value: b.name, count: b.count })),
                ...categories.map(c => ({ type: 'category', value: c.name, count: c.count }))
            ].slice(0, 10)
        };

        c.executionCtx.waitUntil(
            c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL })
        );

        return c.json({ success: true, data: result });
    } catch (error) {
        return c.json({ success: false, error: 'Failed to fetch suggestions' }, 500);
    }
});

search.get('/', async (c) => {
    try {
        const rawQuery = c.req.query('query') || '';
        const explicitCategory = c.req.query('category');
        const explicitSubcategory = c.req.query('subcategory');
        const explicitColor = c.req.query('color');
        const explicitBrand = c.req.query('brand');
        const sort = c.req.query('sort') || 'relevance';
        const page = Math.max(1, parseInt(c.req.query('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));

        if (!rawQuery?.trim() && !explicitCategory && !explicitSubcategory && !explicitColor && !explicitBrand) {
            return c.json({
                success: true,
                data: {
                    products: [],
                    banners: [],
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                    searchMode: 'empty',
                    appliedFilters: {},
                    availableFilters: { categories: [], subcategories: [], colors: [], brands: [], priceRange: { min: 0, max: 0 } }
                }
            });
        }

        const query = correctTypos(rawQuery);
        const cacheKey = `search:v2:${query}:${explicitCategory}:${explicitSubcategory}:${explicitColor}:${explicitBrand}:${sort}:${page}:${limit}`;

        const cached = await c.env.CACHE.get(cacheKey, 'json');
        if (cached) return c.json({ success: true, data: cached });

        const sql = neon(c.env.DATABASE_URL);
        const parsed = query ? expandQuery(query) : {};

        const filters = {
            category: explicitCategory ?? parsed.category,
            subcategory: explicitSubcategory ?? parsed.subcategory,
            color: explicitColor ?? parsed.color,
            brand: explicitBrand ?? parsed.brand,
        };

        const appliedFilters = {
            query: rawQuery || null,
            category: filters.category || null,
            subcategory: filters.subcategory || null,
            color: filters.color || null,
            brand: filters.brand || null,
            sort
        };

        const [results, availableFilters, banners] = await Promise.all([
            executeSearch(sql, { query, filters, limit, offset: (page - 1) * limit, sort }),
            getAvailableFilters(sql, filters, query),
            filters.category
                ? sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [filters.category])
                : Promise.resolve([])
        ]);

        const total = results.length > 0 ? parseInt(results[0].full_count || results.length) : 0;

        const response = {
            products: results,
            banners,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            searchMode: query ? 'search' : 'browse',
            appliedFilters,
            availableFilters,
            suggestedFilters: parsed.confidence >= 1 ? {
                category: parsed.category,
                subcategory: parsed.subcategory,
                color: parsed.color,
                brand: parsed.brand
            } : null
        };

        c.executionCtx.waitUntil(
            c.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: CACHE_TTL })
        );

        return c.json({ success: true, data: response });
    } catch (error) {
        return c.json({ success: false, error: 'Search failed' }, 500);
    }
});

async function executeSearch(sql, { query, filters, limit, offset, sort }) {
    const params = [];
    let idx = 1;
    const conditions = ['is_active = true'];
    const scoreTerms = ['popularity * 0.01'];

    if (filters.category) {
        conditions.push(`category::text ILIKE $${idx++}`);
        params.push(`%${escapeForLike(filters.category)}%`);
        scoreTerms.push(`CASE WHEN category::text ILIKE $${params.length} THEN 10 ELSE 0 END`);
    }

    if (filters.subcategory) {
        const subcatAliases = SUBCATEGORY_ALIASES[filters.subcategory] || [filters.subcategory.toLowerCase()];
        const subcatPatterns = [filters.subcategory, ...subcatAliases].slice(0, 3);
        const startIdx = idx;
        const subcatOrConditions = [];
        for (const pattern of subcatPatterns) {
            subcatOrConditions.push(`subcategory::text ILIKE $${idx++}`);
            params.push(`%${escapeForLike(pattern)}%`);
        }
        conditions.push(`(${subcatOrConditions.join(' OR ')})`);
        scoreTerms.push(`CASE WHEN subcategory::text ILIKE $${startIdx} THEN 8 ELSE 0 END`);
    }

    if (filters.color) {
        const colorIdx = idx++;
        const relatedIdx = idx++;
        conditions.push(`(color ILIKE $${colorIdx} OR color ILIKE $${relatedIdx})`);
        params.push(`%${escapeForLike(filters.color)}%`);
        const relatedColors = getRelatedColors(filters.color);
        params.push(relatedColors.length > 0 ? `%${escapeForLike(relatedColors[0])}%` : `%${escapeForLike(filters.color)}%`);
        scoreTerms.push(`CASE WHEN LOWER(color) = LOWER($${colorIdx}) THEN 10 ELSE CASE WHEN color ILIKE $${colorIdx} THEN 5 ELSE 0 END END`);
    }

    if (filters.brand) {
        conditions.push(`brand ILIKE $${idx++}`);
        params.push(`%${escapeForLike(filters.brand)}%`);
        scoreTerms.push(`CASE WHEN brand ILIKE $${params.length} THEN 10 ELSE 0 END`);
    }

    if (query && query.length >= 2) {
        const queryIdx = idx++;
        const patternIdx = idx++;
        params.push(query, `%${escapeForLike(query)}%`);
        scoreTerms.push(`CASE WHEN search_vector @@ plainto_tsquery('english', $${queryIdx}) THEN 5 ELSE 0 END`);
        scoreTerms.push(`CASE WHEN name ILIKE $${patternIdx} THEN 4 ELSE 0 END`);
        scoreTerms.push(`CASE WHEN brand ILIKE $${patternIdx} THEN 3 ELSE 0 END`);

        if (!filters.category && !filters.subcategory && !filters.color && !filters.brand) {
            conditions.push(`(search_vector @@ plainto_tsquery('english', $${queryIdx}) OR name ILIKE $${patternIdx} OR brand ILIKE $${patternIdx} OR category::text ILIKE $${patternIdx} OR subcategory::text ILIKE $${patternIdx})`);
        }
    }

    const limitIdx = idx++;
    const offsetIdx = idx++;
    params.push(limit, offset);

    const orderBy = sort === 'price_asc' ? 'price ASC'
        : sort === 'price_desc' ? 'price DESC'
            : sort === 'newest' ? 'created_at DESC'
                : 'score DESC, popularity DESC';

    const sqlQuery = `
        SELECT id, name, price, brand, images, category::text as category, subcategory::text as subcategory, color, affiliate_link,
               (${scoreTerms.join(' + ')}) AS score, COUNT(*) OVER() as full_count
        FROM products
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    return await sql(sqlQuery, params);
}
