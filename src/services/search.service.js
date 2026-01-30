import { sql } from '../config/neon.js';
import { expandQuery, getRelatedColors, SUBCATEGORY_ALIASES } from '../config/searchMappings.js';
import { getCached, CACHE_TTL } from '../utils/cache.js';

const EMBEDDING_DIMENSION = 384;
const MAX_PAGE = 1000;
const MAX_LIMIT = 100;

const SLIM_FIELDS = 'id, name, price, brand, images, category::text as category, subcategory::text as subcategory, color, affiliate_link';

function escapeForLike(str) {
  if (!str) return str;
  return str.replace(/[%_]/g, '\\$&');
}

const TYPO_CORRECTIONS = {
  'tshirt': 'tshirt', 'teeshirt': 'tshirt', 'tee': 'tshirt', 't-shirt': 'tshirt',
  'hoody': 'hoodie', 'hoddie': 'hoodie', 'hoodi': 'hoodie',
  'jackt': 'jacket', 'jcket': 'jacket',
  'sweter': 'sweater', 'swetar': 'sweater',
  'jeens': 'jeans', 'jens': 'jeans',
  'trousars': 'trousers', 'trouser': 'trousers',
  'shirt': 'shirt', 'shrt': 'shirt',
  'pant': 'pants', 'pnt': 'pants',
  'sneekers': 'sneakers', 'sneeker': 'sneaker', 'snikers': 'sneakers',
  'sheos': 'shoes', 'shooes': 'shoes',
  'sandle': 'sandals', 'sandal': 'sandals',
  'boot': 'boots', 'bots': 'boots',
  'addidas': 'adidas', 'adiddas': 'adidas',
  'niike': 'nike', 'nkie': 'nike',
  'pumaa': 'puma', 'pumma': 'puma',
  'reebok': 'reebok', 'rebok': 'reebok',
  'runing': 'running', 'runnig': 'running',
  'causal': 'casual', 'formall': 'formal',
  'gyming': 'gym', 'gim': 'gym',
  'partywear': 'party', 'parti': 'party',
  'perfum': 'perfume', 'parfum': 'perfume',
  'accesories': 'accessories', 'acessories': 'accessories',
  'bag': 'bags', 'bg': 'bags',
  'watchs': 'watches', 'wach': 'watch'
};

function correctTypos(query) {
  if (!query) return query;
  return query.toLowerCase().split(/\s+/).map(word => TYPO_CORRECTIONS[word] || word).join(' ');
}

export const parseSearchQuery = (query) => {
  if (!query?.trim()) return { searchTerm: null };
  const corrected = correctTypos(query);
  return expandQuery(corrected);
};

function buildWhereClause(filters, query) {
  const params = [];
  let idx = 1;
  const conditions = ['is_active = true'];

  if (filters.category) {
    conditions.push(`category::text ILIKE $${idx++}`);
    params.push(`%${escapeForLike(filters.category)}%`);
  }

  if (filters.subcategory) {
    const subcatAliases = SUBCATEGORY_ALIASES[filters.subcategory] || [filters.subcategory.toLowerCase()];
    const subcatPatterns = [filters.subcategory, ...subcatAliases].slice(0, 3);
    const subcatOrConditions = [];
    for (const pattern of subcatPatterns) {
      subcatOrConditions.push(`subcategory::text ILIKE $${idx++}`);
      params.push(`%${escapeForLike(pattern)}%`);
    }
    conditions.push(`(${subcatOrConditions.join(' OR ')})`);
  }

  if (filters.color) {
    const colorIdx = idx++;
    const relatedIdx = idx++;
    conditions.push(`(color ILIKE $${colorIdx} OR color ILIKE $${relatedIdx})`);
    params.push(`%${escapeForLike(filters.color)}%`);
    const relatedColors = getRelatedColors(filters.color);
    params.push(relatedColors.length > 0 ? `%${escapeForLike(relatedColors[0])}%` : `%${escapeForLike(filters.color)}%`);
  }

  if (filters.brand) {
    conditions.push(`brand ILIKE $${idx++}`);
    params.push(`%${escapeForLike(filters.brand)}%`);
  }

  if (query && query.length >= 2) {
    conditions.push(`(search_vector @@ plainto_tsquery('english', $${idx}) OR name ILIKE $${idx + 1} OR brand ILIKE $${idx + 1})`);
    params.push(query, `%${escapeForLike(query)}%`);
    idx += 2;
  }

  return { conditions, params, nextIdx: idx };
}

export const getAvailableFilters = async (params) => {
  const { query: rawQuery, category, subcategory, color, brand } = params;
  const query = correctTypos(rawQuery);

  const cacheKey = `filters:${query || ''}:${category || ''}:${subcategory || ''}:${color || ''}:${brand || ''}`;

  return getCached(cacheKey, CACHE_TTL.SEARCH_RESULTS, async () => {
    const filters = { category, subcategory, color, brand };
    const { conditions, params: sqlParams } = buildWhereClause(filters, query);
    const whereClause = conditions.join(' AND ');

    const [categories, subcategories, colors, brands, priceRange] = await Promise.all([
      sql(`
        SELECT category::text as name, COUNT(*)::int as count
        FROM products
        WHERE ${whereClause}
        GROUP BY category
        ORDER BY count DESC
      `, sqlParams),

      sql(`
        SELECT subcategory::text as name, COUNT(*)::int as count
        FROM products
        WHERE ${whereClause}
        GROUP BY subcategory
        HAVING subcategory IS NOT NULL AND subcategory::text != ''
        ORDER BY count DESC
        LIMIT 30
      `, sqlParams),

      sql(`
        SELECT TRIM(color) as name, COUNT(*)::int as count
        FROM products
        WHERE ${whereClause}
        GROUP BY TRIM(color)
        HAVING TRIM(color) IS NOT NULL AND TRIM(color) != ''
        ORDER BY count DESC
        LIMIT 30
      `, sqlParams),

      sql(`
        SELECT brand as name, COUNT(*)::int as count
        FROM products
        WHERE ${whereClause}
        GROUP BY brand
        HAVING brand IS NOT NULL AND brand != ''
        ORDER BY count DESC
        LIMIT 50
      `, sqlParams),

      sql(`
        SELECT MIN(price)::numeric as min, MAX(price)::numeric as max
        FROM products
        WHERE ${whereClause}
      `, sqlParams)
    ]);

    return {
      categories: categories || [],
      subcategories: subcategories || [],
      colors: colors || [],
      brands: brands || [],
      priceRange: priceRange[0] || { min: 0, max: 0 }
    };
  });
};

export const unifiedSearch = async (params) => {
  const rawQuery = params.query;
  const explicitCategory = params.category;
  const explicitSubcategory = params.subcategory;
  const explicitColor = params.color;
  const explicitBrand = params.brand;
  const sort = params.sort;
  const page = Math.max(1, Math.min(MAX_PAGE, parseInt(params.page) || 1));
  const limit = Math.max(1, Math.min(MAX_LIMIT, parseInt(params.limit) || 20));

  if (!rawQuery?.trim() && !explicitCategory && !explicitSubcategory && !explicitColor && !explicitBrand) {
    return {
      products: [],
      banners: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      searchMode: 'empty',
      appliedFilters: {},
      availableFilters: { categories: [], subcategories: [], colors: [], brands: [], priceRange: { min: 0, max: 0 } }
    };
  }

  if (rawQuery && rawQuery.length === 1) {
    return {
      products: [],
      banners: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      searchMode: 'empty',
      appliedFilters: {},
      availableFilters: { categories: [], subcategories: [], colors: [], brands: [], priceRange: { min: 0, max: 0 } }
    };
  }

  const cacheKey = `search:v2:${rawQuery || ''}:${explicitCategory || ''}:${explicitSubcategory || ''}:${explicitColor || ''}:${explicitBrand || ''}:${sort || ''}:${page}:${limit}`;

  return getCached(cacheKey, CACHE_TTL.SEARCH_RESULTS, async () => {
    const offset = (page - 1) * limit;
    const query = correctTypos(rawQuery);
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
      sort: sort || 'relevance'
    };

    const [results, availableFilters, banners] = await Promise.all([
      executeSearch({ query, filters, limit, offset, sort }),
      getAvailableFilters({ query: rawQuery, ...filters }),
      filters.category
        ? sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [filters.category])
        : Promise.resolve([])
    ]);

    const total = results.length > 0 ? parseInt(results[0].full_count || results.length) : 0;

    return {
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
  });
};

async function executeSearch({ query, filters, limit, offset, sort }) {
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
    SELECT ${SLIM_FIELDS}, (${scoreTerms.join(' + ')}) AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  return await sql(sqlQuery, params);
}

export const hybridSearch = async (params) => {
  const { query, embedding, category, subcategory, color, brand, sort, page = 1, limit = 20 } = params;

  if (!query || query.length < 2) {
    return { products: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty', availableFilters: {} };
  }

  const hasEmbedding = embedding && Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSION;

  if (!hasEmbedding) {
    return unifiedSearch(params);
  }

  const cacheKey = `hybrid:v2:${query}:${category || ''}:${color || ''}:${brand || ''}:${sort || ''}:${page}:${limit}`;

  return getCached(cacheKey, CACHE_TTL.SEARCH_RESULTS, async () => {
    const offset = (page - 1) * limit;
    const vectorStr = `[${embedding.join(',')}]`;
    const correctedQuery = correctTypos(query);
    const parsed = expandQuery(correctedQuery);

    const filters = {
      category: category ?? parsed.category,
      subcategory: subcategory ?? parsed.subcategory,
      color: color ?? parsed.color,
      brand: brand ?? parsed.brand,
    };

    const sqlParams = [vectorStr, correctedQuery];
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

    const [results, availableFilters] = await Promise.all([
      sql(sqlQuery, sqlParams),
      getAvailableFilters({ query, ...filters })
    ]);

    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;

    return {
      products: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchMode: 'hybrid',
      appliedFilters: {
        query,
        category: filters.category,
        color: filters.color,
        brand: filters.brand
      },
      availableFilters
    };
  });
};

export const smartSearch = unifiedSearch;
export const advancedSearch = unifiedSearch;

export const getSearchSuggestions = async (partialQuery) => {
  if (!partialQuery || partialQuery.length < 2) {
    return { suggestions: [] };
  }

  const cacheKey = `suggestions:${partialQuery}`;

  return getCached(cacheKey, CACHE_TTL.SEARCH_RESULTS, async () => {
    const pattern = `%${escapeForLike(partialQuery)}%`;

    const [products, brands, categories] = await Promise.all([
      sql(`
        SELECT DISTINCT name
        FROM products
        WHERE is_active = true AND name ILIKE $1
        ORDER BY popularity DESC
        LIMIT 5
      `, [pattern]),

      sql(`
        SELECT DISTINCT brand as name, COUNT(*)::int as count
        FROM products
        WHERE is_active = true AND brand ILIKE $1
        GROUP BY brand
        ORDER BY count DESC
        LIMIT 5
      `, [pattern]),

      sql(`
        SELECT DISTINCT category::text as name, COUNT(*)::int as count
        FROM products
        WHERE is_active = true AND category::text ILIKE $1
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `, [pattern])
    ]);

    return {
      suggestions: [
        ...products.map(p => ({ type: 'product', value: p.name })),
        ...brands.map(b => ({ type: 'brand', value: b.name, count: b.count })),
        ...categories.map(c => ({ type: 'category', value: c.name, count: c.count }))
      ].slice(0, 10)
    };
  });
};
