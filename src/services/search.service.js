import { sql } from '../config/neon.js';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SUBCATEGORIES,
  ALL_SUBCATEGORIES,
  PRODUCT_COLORS,
  PRODUCT_BRANDS
} from '../config/constants.js';
import { expandQuery, OCCASION_MAP } from '../config/searchMappings.js';
import logger from '../utils/logger.js';

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
  const map = {};

  PRODUCT_CATEGORIES.forEach(cat => {
    const key = cat.toLowerCase();
    const subs = PRODUCT_SUBCATEGORIES[cat] || [];
    map[key] = [...new Set([key, ...subs.map(s => s.toLowerCase().split(/[\s-]+/)).flat()])];
  });

  Object.entries(PRODUCT_SUBCATEGORIES).forEach(([cat, subs]) => {
    subs.forEach(sub => {
      const key = sub.toLowerCase();
      map[key] = [key, cat.toLowerCase()];
    });
  });

  const conceptSynonyms = {
    'workout': ['gym', 'fitness', 'training', 'exercise', 'athletic', 'sports'],
    'gym': ['workout', 'fitness', 'training', 'athletic', 'sports wear'],
    'office': ['formal', 'professional', 'business', 'office wear'],
    'formal': ['office', 'professional', 'business', 'office wear'],
    'party': ['festive', 'celebration', 'wedding', 'traditional'],
    'wedding': ['party', 'festive', 'traditional', 'ethnic'],
    'casual': ['everyday', 'relaxed', 'comfortable', 'tshirt', 'jeans'],
    'winter': ['warm', 'cold', 'thermal', 'jacket', 'sweater', 'hoodies'],
    'warm': ['winter', 'thermal', 'fleece', 'jacket', 'sweater'],
    'summer': ['light', 'breathable', 'cool', 'linen', 'cotton'],
    'running': ['jogging', 'marathon', 'athletic', 'sports', 'sports shoes'],
    'sneakers': ['shoes', 'footwear', 'trainers', 'canvas shoes'],
    'tee': ['tshirt', 't-shirt', 'top'],
    'hoodie': ['sweatshirt', 'hoodies', 'pullover'],
    'luxury': ['premium', 'expensive', 'designer', 'luxurious'],
    'budget': ['cheap', 'affordable', 'budget-friendly'],
    'streetwear': ['urban', 'trendy', 'hoodies', 'oversized'],
    'minimalist': ['minimal', 'simple', 'clean', 'basic'],
  };

  return { ...map, ...conceptSynonyms };
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

export const parseSearchQuery = (query) => {
  if (!query?.trim()) return { searchTerm: null };
  return expandQuery(query);
};

export const unifiedSearch = async (params) => {
  const { query: rawQuery, category, subcategory, color, brand, sort, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  if (rawQuery && rawQuery.length === 1) {
    return { products: [], banners: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty', filters: {}, metadata: {} };
  }

  const query = correctTypos(rawQuery);
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

  try {
    const results = await executeSearch({
      query, appliedCategory, appliedSubcategory, appliedColor, appliedBrand,
      semanticTags, occasionCategories, limit, offset, sort
    });

    const banners = appliedCategory
      ? await sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [appliedCategory])
      : [];

    const total = results.length > 0 ? parseInt(results[0].full_count || 0) : 0;

    return {
      products: results,
      banners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchMode: results.length > 0 ? 'smart' : 'empty',
      filters: { appliedCategory, appliedSubcategory, appliedColor, appliedBrand, appliedSort: sort || 'relevance' },
      metadata: { query, semanticTagsUsed: semanticTags.slice(0, 10) },
    };
  } catch (e) {
    logger.error('Search error', e);
    throw new Error(`Database error: ${e.message}`);
  }
};

const executeSearch = async (opts) => {
  const { query, appliedCategory, appliedSubcategory, appliedColor, appliedBrand,
    semanticTags, occasionCategories, limit, offset, sort } = opts;

  const params = [];
  let idx = 1;
  const conditions = ['is_active = true'];

  if (appliedCategory) {
    conditions.push(`category::text ILIKE $${idx++}`);
    params.push(`%${appliedCategory}%`);
  } else if (occasionCategories.length > 0) {
    conditions.push(`category::text = ANY($${idx++})`);
    params.push(occasionCategories);
  }

  if (appliedSubcategory) {
    conditions.push(`subcategory::text ILIKE $${idx++}`);
    params.push(`%${appliedSubcategory}%`);
  }

  if (appliedColor) {
    conditions.push(`color ILIKE $${idx++}`);
    params.push(`%${appliedColor}%`);
  }

  if (appliedBrand) {
    conditions.push(`brand ILIKE $${idx++}`);
    params.push(`%${appliedBrand}%`);
  }

  const tagIdx = idx++;
  params.push(semanticTags.length > 0 ? semanticTags : ['__none__']);

  let searchCondition = '';
  let ranking = 'popularity';

  if (query && query.length > 1) {
    const queryIdx = idx++;
    const patternIdx = idx++;
    params.push(query, `%${query}%`);

    searchCondition = `AND (
      search_vector @@ plainto_tsquery('english', $${queryIdx})
      OR semantic_tags && $${tagIdx}
      OR name ILIKE $${patternIdx}
      OR brand ILIKE $${patternIdx}
      OR category::text ILIKE $${patternIdx}
      OR subcategory::text ILIKE $${patternIdx}
    )`;

    ranking = `(
      CASE WHEN search_vector @@ plainto_tsquery('english', $${queryIdx}) THEN 5 ELSE 0 END +
      CASE WHEN semantic_tags && $${tagIdx} THEN 3 ELSE 0 END +
      CASE WHEN name ILIKE $${patternIdx} THEN 4 ELSE 0 END +
      CASE WHEN brand ILIKE $${patternIdx} THEN 2 ELSE 0 END +
      CASE WHEN category::text ILIKE $${patternIdx} THEN 2 ELSE 0 END +
      popularity * 0.1
    )`;
  }

  const orderBy = sort === 'price_asc' ? 'price ASC'
    : sort === 'price_desc' ? 'price DESC'
      : sort === 'newest' ? 'created_at DESC'
        : 'score DESC';

  params.push(limit, offset);
  const limitIdx = idx++;
  const offsetIdx = idx++;

  const sqlQuery = `
    SELECT *, ${ranking} AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE ${conditions.join(' AND ')} ${searchCondition}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  let results = await sql(sqlQuery, params);

  if (results.length === 0 && query && query.length > 2) {
    results = await fuzzySearch(query, appliedCategory, appliedColor, limit, offset);
  }

  return results;
};

const fuzzySearch = async (query, category, color, limit, offset) => {
  const pattern = `%${query}%`;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let filters = '';
  const params = [pattern, limit, offset];
  let paramIdx = 4;

  if (category) {
    filters += ` AND category::text ILIKE $${paramIdx++}`;
    params.push(`%${category}%`);
  }
  if (color) {
    filters += ` AND color ILIKE $${paramIdx++}`;
    params.push(`%${color}%`);
  }

  let results = await sql(`
    SELECT *, popularity AS score, COUNT(*) OVER() as full_count
    FROM products
    WHERE is_active = true
      AND (name ILIKE $1 OR brand ILIKE $1 OR description ILIKE $1)
      ${filters}
    ORDER BY popularity DESC
    LIMIT $2 OFFSET $3
  `, params);

  if (results.length === 0 && words.length > 0) {
    const wordPatterns = words.map(w => `%${w}%`);
    const wordConditions = wordPatterns.map((_, i) => `(name ILIKE $${i + 1} OR description ILIKE $${i + 1})`).join(' OR ');

    results = await sql(`
      SELECT *, popularity AS score, COUNT(*) OVER() as full_count
      FROM products
      WHERE is_active = true AND (${wordConditions})
      ORDER BY popularity DESC
      LIMIT $${words.length + 1} OFFSET $${words.length + 2}
    `, [...wordPatterns, limit, offset]);
  }

  return results;
};

// ============================================================================
// HYBRID SEARCH (pgvector + Text + Filters)
// ============================================================================

export const hybridSearch = async (params) => {
  const { query, embedding, category, subcategory, color, brand, sort, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  if (!query || query.length < 2) {
    return { products: [], total: 0, page, limit, totalPages: 0, searchMode: 'empty' };
  }

  const hasEmbedding = embedding && Array.isArray(embedding) && embedding.length === 384;

  if (!hasEmbedding) {
    return unifiedSearch(params);
  }

  const vectorStr = `[${embedding.join(',')}]`;

  const orderBy = sort === 'price_asc' ? 'p.price ASC'
    : sort === 'price_desc' ? 'p.price DESC'
      : sort === 'newest' ? 'p.created_at DESC'
        : 'combined_score DESC';

  // Build unified sqlParams: $1=vector, $2=query, $3+=filters, then limit/offset
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
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchMode: 'hybrid',
      filters: { appliedCategory: category, appliedSubcategory: subcategory, appliedColor: color, appliedBrand: brand },
      metadata: { query, hasVectorSearch: true },
    };
  } catch (error) {
    logger.error('Hybrid search error', error);
    return unifiedSearch(params);
  }
};

export const smartSearch = unifiedSearch;
export const advancedSearch = unifiedSearch;

export const getSearchSuggestions = async (partialQuery) => {
  if (!partialQuery?.trim() || partialQuery.length < 2) return { products: [] };

  const term = `%${partialQuery.toLowerCase()}%`;
  const products = await sql(
    `SELECT DISTINCT name FROM products WHERE is_active = true AND (name ILIKE $1 OR brand ILIKE $1) ORDER BY popularity DESC LIMIT 5`,
    [term]
  );

  return { products: products.map(p => p.name), categories: [], colors: [], styles: [] };
};
