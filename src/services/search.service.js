import { sql } from '../config/neon.js';
import { expandQuery, OCCASION_MAP, getRelatedColors } from '../config/searchMappings.js';
import logger from '../utils/logger.js';

const EMBEDDING_DIMENSION = 384;
const MAX_PAGE = 1000;
const MAX_LIMIT = 100;

function escapeForLike(str) {
  if (!str) return str;
  return str.replace(/[%_]/g, '\\$&');
}

const TYPO_CORRECTIONS = {
  // Apparel
  'tshirt': 't-shirt', 'teeshirt': 't-shirt', 'tee': 't-shirt',
  'hoody': 'hoodie', 'hoddie': 'hoodie', 'hoodi': 'hoodie',
  'jackt': 'jacket', 'jcket': 'jacket',
  'sweter': 'sweater', 'swetar': 'sweater',
  'jeens': 'jeans', 'jens': 'jeans',
  'trousars': 'trousers', 'trouser': 'trousers',
  'shirt': 'shirt', 'shrt': 'shirt',
  'pant': 'pants', 'pnt': 'pants',

  // Footwear
  'sneekers': 'sneakers', 'sneeker': 'sneaker', 'snikers': 'sneakers',
  'sheos': 'shoes', 'shooes': 'shoes',
  'sandle': 'sandals', 'sandal': 'sandals',
  'boot': 'boots', 'bots': 'boots',

  // Brands
  'addidas': 'adidas', 'adiddas': 'adidas',
  'niike': 'nike', 'nkie': 'nike',
  'pumaa': 'puma', 'pumma': 'puma',
  'reebok': 'reebok', 'rebok': 'reebok',

  // Activities/Occasions
  'runing': 'running', 'runnig': 'running',
  'causal': 'casual', 'formall': 'formal',
  'gyming': 'gym', 'gim': 'gym',
  'partywear': 'party', 'parti': 'party',

  // Accessories
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

export const unifiedSearch = async (params) => {
  const rawQuery = params.query;
  const category = params.category;
  const subcategory = params.subcategory;
  const color = params.color;
  const brand = params.brand;
  const sort = params.sort;
  const page = Math.max(1, Math.min(MAX_PAGE, parseInt(params.page) || 1));
  const limit = Math.max(1, Math.min(MAX_LIMIT, parseInt(params.limit) || 20));
  const offset = (page - 1) * limit;

  if (!rawQuery?.trim() && !category && !subcategory && !color && !brand) {
    return { products: [], banners: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty', filters: {}, metadata: {} };
  }

  if (rawQuery && rawQuery.length === 1) {
    return { products: [], banners: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty', filters: {}, metadata: {} };
  }

  const query = correctTypos(rawQuery);
  const parsed = query ? expandQuery(query) : {};

  const filters = {
    category: category || parsed.category,
    subcategory: subcategory || parsed.subcategory,
    color: color || parsed.color,
    brand: brand || parsed.brand,
    occasion: parsed.occasion,
  };

  try {
    let results;

    if (parsed.confidence >= 2 || filters.category || filters.color || filters.brand) {
      results = await executeStrictSearch({ query, filters, limit, offset, sort, parsed });
    } else if (query) {
      results = await executeTextSearch({ query, filters, limit, offset, sort });
    } else {
      results = await executeBrowseSearch({ filters, limit, offset, sort });
    }

    if (results.length === 0 && parsed.confidence >= 1) {
      results = await executeFallbackSearch({ query, filters, limit, offset, parsed });
    }

    const banners = filters.category
      ? await sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [filters.category])
      : [];

    const total = results.length > 0 ? parseInt(results[0].full_count || results.length) : 0;

    return {
      products: results,
      banners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchMode: results.length > 0 ? (parsed.confidence >= 2 ? 'strict' : 'smart') : 'empty',
      filters: {
        appliedCategory: filters.category,
        appliedSubcategory: filters.subcategory,
        appliedColor: filters.color,
        appliedBrand: filters.brand,
        appliedSort: sort || 'relevance',
      },
      metadata: {
        query,
        parsed: { confidence: parsed.confidence, isCompound: parsed.isCompound },
      },
    };
  } catch (e) {
    logger.error('Search error', e);
    throw new Error(`Search failed: ${e.message}`);
  }
};

async function executeStrictSearch({ query, filters, limit, offset, sort, parsed }) {
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
    conditions.push(`subcategory::text ILIKE $${idx++}`);
    params.push(`%${escapeForLike(filters.subcategory)}%`);
    scoreTerms.push(`CASE WHEN subcategory::text ILIKE $${params.length} THEN 8 ELSE 0 END`);
  }

  if (filters.color) {
    const colorIdx = idx++;
    conditions.push(`(color ILIKE $${colorIdx} OR color ILIKE $${idx++})`);
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

  const limitIdx = idx++;
  const offsetIdx = idx++;
  params.push(limit, offset);

  const orderBy = sort === 'price_asc' ? 'price ASC'
    : sort === 'price_desc' ? 'price DESC'
      : sort === 'newest' ? 'created_at DESC'
        : 'score DESC, popularity DESC';

  const sqlQuery = `
    SELECT *, (${scoreTerms.join(' + ')}) AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  return await sql(sqlQuery, params);
}

async function executeTextSearch({ query, filters, limit, offset, sort }) {
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

  const sqlQuery = `
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
  `;

  return await sql(sqlQuery, params);
}

async function executeBrowseSearch({ filters, limit, offset, sort }) {
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

  const sqlQuery = `
    SELECT *, popularity AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  return await sql(sqlQuery, params);
}

async function executeFallbackSearch({ query, filters, limit, offset, parsed }) {
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

  const sqlQuery = `
    SELECT *, popularity AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions}
    ORDER BY popularity DESC
    LIMIT $2 OFFSET $3
  `;

  return await sql(sqlQuery, params);
}

export const hybridSearch = async (params) => {
  const { query, embedding, category, subcategory, color, brand, sort, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  if (!query || query.length < 2) {
    return { products: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty' };
  }

  const hasEmbedding = embedding && Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSION;

  if (!hasEmbedding) {
    return unifiedSearch(params);
  }

  const vectorStr = `[${embedding.join(',')}]`;
  const correctedQuery = correctTypos(query);
  const parsed = expandQuery(correctedQuery);

  const filters = {
    category: category || parsed.category,
    color: color || parsed.color,
    brand: brand || parsed.brand,
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
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchMode: 'hybrid',
      filters: { appliedCategory: filters.category, appliedColor: filters.color, appliedBrand: filters.brand },
      metadata: { query: correctedQuery, hasVectorSearch: true },
    };
  } catch (error) {
    logger.error('Hybrid search error', error);
    return unifiedSearch(params);
  }
};

export const smartSearch = unifiedSearch;
export const advancedSearch = unifiedSearch;

export const getSearchSuggestions = async (partialQuery) => {
  return { products: [], categories: [], colors: [], styles: [] };
};
