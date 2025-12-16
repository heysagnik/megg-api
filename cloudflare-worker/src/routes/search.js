import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { expandQuery, OCCASION_MAP } from '../lib/searchMappings.js';
import { PRODUCT_CATEGORIES, ALL_SUBCATEGORIES, PRODUCT_COLORS, PRODUCT_BRANDS } from '../lib/constants.js';

export const search = new Hono();

const generateTypoVariants = (word) => {
    const variants = [];
    const w = word.toLowerCase();
    if (w.length < 3) return variants;

    for (let i = 0; i < w.length; i++) {
        variants.push(w.slice(0, i) + w.slice(i + 1));
    }
    for (let i = 0; i < w.length - 1; i++) {
        variants.push(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
    }
    for (let i = 0; i < w.length; i++) {
        variants.push(w.slice(0, i) + w[i] + w[i] + w.slice(i + 1));
    }
    return variants.filter(v => v !== w && v.length >= 3);
};

const buildTypoMap = () => {
    const map = {};
    const allTerms = [
        ...PRODUCT_CATEGORIES,
        ...ALL_SUBCATEGORIES,
        ...PRODUCT_COLORS,
        ...PRODUCT_BRANDS,
    ];

    allTerms.forEach(term => {
        const words = term.toLowerCase().split(/[\s-]+/);
        words.forEach(word => {
            if (word.length >= 4) {
                generateTypoVariants(word).forEach(typo => {
                    if (!map[typo]) map[typo] = word;
                });
            }
        });
    });

    const manualTypos = {
        'tshirt': 't-shirt', 'teeshirt': 't-shirt',
        'hoody': 'hoodie', 'hoddie': 'hoodie', 'hoodi': 'hoodie',
        'runing': 'running', 'runnig': 'running',
        'addidas': 'adidas', 'adiddas': 'adidas',
        'niike': 'nike', 'nkie': 'nike',
        'causal': 'casual', 'formall': 'formal',
        'sneekers': 'sneakers', 'sneeker': 'sneaker', 'snikers': 'sneakers',
        'sheos': 'shoes', 'shooes': 'shoes',
    };

    return { ...map, ...manualTypos };
};

const TYPO_MAP = buildTypoMap();

const correctTypos = (query) => {
    if (!query) return query;
    return query.toLowerCase().split(/\s+/).map(word => TYPO_MAP[word] || word).join(' ');
};

const buildSynonymMap = () => {
    // Simplified map for brevity, logic remains valid
    const conceptSynonyms = {
        'workout': ['gym', 'fitness', 'training', 'exercise', 'athletic', 'sports'],
        'gym': ['workout', 'fitness', 'training', 'athletic', 'sports wear'],
        'winter': ['warm', 'cold', 'thermal', 'jacket', 'sweater', 'hoodies'],
        'warm': ['winter', 'thermal', 'fleece', 'jacket', 'sweater'],
        'summer': ['light', 'breathable', 'cool', 'linen', 'cotton'],
        'casual': ['everyday', 'relaxed', 'comfortable', 'tshirt', 'jeans'],
        'party': ['festive', 'celebration', 'wedding', 'traditional'],
    };
    return conceptSynonyms;
};
const SYNONYM_MAP = buildSynonymMap();

const expandSynonyms = (tags) => {
    const expanded = new Set(tags);
    tags.forEach(tag => {
        const t = tag.toLowerCase();
        if (SYNONYM_MAP[t]) SYNONYM_MAP[t].forEach(s => expanded.add(s));
    });
    return Array.from(expanded);
};

// ============================================================================
// SEARCH LOGIC
// ============================================================================

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

        const query = correctTypos(rawQuery);
        const cacheKey = `search:${query}:${category}:${brand}:${sort}:${page}`;
        const cached = await c.env.CACHE.get(cacheKey, 'json');
        if (cached) return c.json(cached);

        let embedding = null;

        // Generate embedding locally if query is long enough using Workers AI
        if (query.length >= 3 && c.env.AI) {
            try {
                const embResponse = await c.env.AI.run(c.env.EMBEDDING_MODEL || '@cf/baai/bge-small-en-v1.5', {
                    text: [query]
                });
                if (embResponse?.data?.[0]) {
                    embedding = embResponse.data[0];
                }
            } catch (e) {
                console.error('Embedding generation failed:', e);
            }
        }

        const sql = neon(c.env.DATABASE_URL);
        let result = await hybridSearch(sql, {
            query,
            embedding,
            category, subcategory, color, brand,
            sort, page, limit
        });

        // Add banners
        const banners = (category || result.filters?.appliedCategory)
            ? await sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [category || result.filters.appliedCategory])
            : [];

        const response = {
            ...result,
            banners,
        };

        // Cache for 5 mins
        await c.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });

        return c.json(response);
    } catch (error) {
        console.error('Search handler error:', error);
        return c.json({ error: 'Search failed', message: error.message }, 500);
    }
});

async function hybridSearch(sql, params) {
    const { query, embedding, category, subcategory, color, brand, sort, page, limit } = params;

    // Fallback to text search if no embedding or short query
    if (!embedding || !query || query.length < 2) {
        return executeSearch(sql, params);
    }

    const offset = (page - 1) * limit;
    const vectorStr = `[${embedding.join(',')}]`;

    // Sort logic
    const orderBy = sort === 'price_asc' ? 'p.price ASC'
        : sort === 'price_desc' ? 'p.price DESC'
            : sort === 'newest' ? 'p.created_at DESC'
                : 'combined_score DESC';

    // Build conditions
    const sqlParams = [vectorStr, query];
    const vectorConditions = ['embedding IS NOT NULL', 'is_active = true'];
    const textConditions = ['is_active = true'];
    let paramIdx = 3;

    if (category) {
        vectorConditions.push(`category::text ILIKE $${paramIdx}`);
        textConditions.push(`category::text ILIKE $${paramIdx}`);
        sqlParams.push(`%${category}%`);
        paramIdx++;
    }
    if (color) {
        vectorConditions.push(`LOWER(color) = LOWER($${paramIdx})`);
        textConditions.push(`LOWER(color) = LOWER($${paramIdx})`);
        sqlParams.push(color);
        paramIdx++;
    }
    if (brand) {
        vectorConditions.push(`brand ILIKE $${paramIdx}`);
        textConditions.push(`brand ILIKE $${paramIdx}`);
        sqlParams.push(`%${brand}%`);
        paramIdx++;
    }

    const limitIdx = paramIdx;
    const offsetIdx = paramIdx + 1;
    sqlParams.push(limit, offset);

    try {
        const sqlQuery = `
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
        `;

        const results = await sql(sqlQuery, sqlParams);
        const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;

        return {
            products: results,
            total, page, limit, totalPages: Math.ceil(total / limit),
            searchMode: 'hybrid',
            filters: { appliedCategory: category, appliedBrand: brand },
            metadata: { query, hasVectorSearch: true }
        };
    } catch (e) {
        console.error('Hybrid search error:', e);
        return executeSearch(sql, params);
    }
}

async function executeSearch(sql, params) {
    const { query, category, subcategory, color, brand, sort, page, limit } = params;
    const offset = (page - 1) * limit;

    const parsed = query ? expandQuery(query) : {};
    const appliedCategory = category || parsed.category;
    const appliedSubcategory = subcategory || parsed.subcategory;
    const appliedColor = color || parsed.color;
    const appliedBrand = brand || parsed.brand;

    let semanticTags = [...(parsed.semanticTags || [])];
    if (query) {
        query.toLowerCase().split(/\s+/).filter(w => w.length > 2).forEach(w => semanticTags.push(w));
    }
    semanticTags = expandSynonyms(semanticTags);

    let occasionCategories = [];
    if (parsed.occasion && OCCASION_MAP[parsed.occasion]) {
        occasionCategories = OCCASION_MAP[parsed.occasion].categories;
    }

    // Build SQL
    const sqlParams = [];
    let idx = 1;
    const conditions = ['is_active = true'];

    if (appliedCategory) {
        conditions.push(`category::text ILIKE $${idx++}`);
        sqlParams.push(`%${appliedCategory}%`);
    } else if (occasionCategories.length > 0) {
        conditions.push(`category::text = ANY($${idx++})`);
        sqlParams.push(occasionCategories);
    }

    if (appliedSubcategory) {
        conditions.push(`subcategory::text ILIKE $${idx++}`);
        sqlParams.push(`%${appliedSubcategory}%`);
    }
    if (appliedColor) {
        conditions.push(`color ILIKE $${idx++}`);
        sqlParams.push(`%${appliedColor}%`);
    }
    if (appliedBrand) {
        conditions.push(`brand ILIKE $${idx++}`);
        sqlParams.push(`%${appliedBrand}%`);
    }

    const tagIdx = idx++;
    sqlParams.push(semanticTags.length > 0 ? semanticTags : ['__none__']);

    let searchCondition = '';
    let ranking = 'popularity';

    if (query && query.length > 1) {
        const queryIdx = idx++;
        const patternIdx = idx++;
        sqlParams.push(query, `%${query}%`);

        searchCondition = `AND (
          search_vector @@ plainto_tsquery('english', $${queryIdx})
          OR semantic_tags && $${tagIdx}
          OR name ILIKE $${patternIdx}
          OR brand ILIKE $${patternIdx}
        )`;

        ranking = `(
          CASE WHEN search_vector @@ plainto_tsquery('english', $${queryIdx}) THEN 5 ELSE 0 END +
          CASE WHEN semantic_tags && $${tagIdx} THEN 3 ELSE 0 END +
          CASE WHEN name ILIKE $${patternIdx} THEN 4 ELSE 0 END +
          popularity * 0.1
        )`;
    }

    const orderBy = sort === 'price_asc' ? 'price ASC'
        : sort === 'price_desc' ? 'price DESC'
            : sort === 'newest' ? 'created_at DESC'
                : 'score DESC';

    sqlParams.push(limit, offset);
    const limitIdx = idx++;
    const offsetIdx = idx++;

    const sqlQuery = `
        SELECT *, ${ranking} AS score, COUNT(*) OVER() as full_count
        FROM products
        WHERE ${conditions.join(' AND ')} ${searchCondition}
        ORDER BY ${orderBy}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const results = await sql(sqlQuery, sqlParams);
    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;

    return {
        products: results,
        total, page, limit, totalPages: Math.ceil(total / limit),
        searchMode: results.length > 0 ? 'smart' : 'empty',
        filters: { appliedCategory, appliedSubcategory, appliedColor, appliedBrand },
        metadata: { query, semanticTagsUsed: semanticTags.slice(0, 10) }
    };
}
