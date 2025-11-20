import { supabaseAdmin } from '../config/supabase.js';
import { COLOR_KEYWORDS, STYLE_KEYWORDS, CATEGORY_KEYWORDS, SUBCATEGORY_KEYWORDS } from '../config/searchKeywords.js';
import { PRODUCT_SUBCATEGORIES, PRODUCT_CATEGORIES } from '../config/constants.js';
import { PAGINATION } from '../config/constants.js';

const matchWithWordBoundary = (text, keyword) => {
  const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(text);
};

const isQueryRedundantWithFilters = (query, category, subcategory) => {
  if (!query) return true;
  const q = String(query).toLowerCase().trim();
  if (!q) return true;

  if (subcategory && SUBCATEGORY_KEYWORDS[subcategory]) {
    const subKw = SUBCATEGORY_KEYWORDS[subcategory];
    if (subKw?.some(kw => matchWithWordBoundary(q, String(kw).toLowerCase()))) {
      return true;
    }
    if (matchWithWordBoundary(q, subcategory.toLowerCase())) return true;
  }

  if (category && CATEGORY_KEYWORDS[category]) {
    const catKw = CATEGORY_KEYWORDS[category];
    if (catKw?.some(kw => matchWithWordBoundary(q, String(kw).toLowerCase()))) {
      return true;
    }
    if (matchWithWordBoundary(q, category.toLowerCase())) return true;
  }

  return false;
};

const findBestCategoryMatch = (query) => {
  const scores = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (matchWithWordBoundary(query, keyword)) {
        const exactMatch = query === keyword;
        const startsWithMatch = query.startsWith(keyword);
        const score = exactMatch ? 100 : startsWithMatch ? 50 : keyword.length;

        scores.push({ category, score, keyword });
      }
    }
  }

  if (scores.length === 0) return null;

  scores.sort((a, b) => b.score - a.score);
  return scores[0].category;
};

const findBestSubcategoryMatch = (query, category = null) => {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  const subcategoryScores = new Map();

  for (const [subcategory, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    let categoryMatch = false;

    if (category) {
      const categorySubcategories = PRODUCT_SUBCATEGORIES[category] || [];
      categoryMatch = categorySubcategories.includes(subcategory);
    }

    if (!categoryMatch && category) {
      continue;
    }

    let bestScore = 0;
    let bestKeyword = null;

    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      const keywordLower = keyword.toLowerCase();
      const keywordWords = keywordLower.split(/\s+/);

      let matchScore = 0;

      if (queryLower === keywordLower) {
        matchScore = 10000;
      } else if (queryLower.includes(keywordLower) && keywordLower.length > 3) {
        matchScore = 5000 + (keyword.length * 20);
      } else if (matchWithWordBoundary(query, keyword)) {
        matchScore = 3000 + (keyword.length * 10);
      } else if (keywordWords.length > 1) {
        const allWordsPresent = keywordWords.every(kw => queryWords.includes(kw));
        if (allWordsPresent) {
          matchScore = 4000 + (keyword.length * 25);
        }
      } else if (keywordWords.length === 1 && queryWords.includes(keywordLower)) {
        matchScore = 1000 + (keyword.length * 5);
      }

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestKeyword = keyword;
      }
    }

    if (bestScore > 0) {
      if (categoryMatch) {
        bestScore += 100000;
      }

      const subcategoryLower = subcategory.toLowerCase();
      const subcategoryWords = subcategoryLower.split(/\s+/);
      const matchingWords = subcategoryWords.filter(word =>
        queryWords.includes(word) && word.length > 2
      );
      bestScore += matchingWords.length * 500;

      subcategoryScores.set(subcategory, { score: bestScore, keyword: bestKeyword, categoryMatch });
    }
  }

  if (subcategoryScores.size === 0) return null;

  const sorted = Array.from(subcategoryScores.entries())
    .sort((a, b) => {
      if (b[1].score !== a[1].score) return b[1].score - a[1].score;
      return b[1].keyword.length - a[1].keyword.length;
    });

  const [bestSubcategory, meta] = sorted[0];
  return { subcategory: bestSubcategory, keyword: meta.keyword, score: meta.score, categoryMatch: meta.categoryMatch };
};

export const parseSearchQuery = (query) => {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);

  const filters = {
    category: null,
    subcategory: null,
    color: null,
    style: null,
    categories: [],
    searchTerm: null,
    isDirectCategoryMatch: false,
    isSubcategoryMatch: false,
    isStyleSearch: false
  };

  const bestCategory = findBestCategoryMatch(normalizedQuery);
  if (bestCategory) {
    filters.category = bestCategory;
    filters.isDirectCategoryMatch = true;
  }

  const bestSubcategoryInfo = findBestSubcategoryMatch(normalizedQuery, bestCategory);
  if (bestSubcategoryInfo) {
    const { subcategory: bestSubcategory, keyword: matchedKeyword } = bestSubcategoryInfo;

    const GENERIC_CATEGORY_TOKENS = {
      Hoodies: ['hoodie', 'hoodies'],
      Tshirt: ['tshirt', 't-shirts', 't shirt', 'tee', 'tees'],
      Sweatshirt: ['sweatshirt', 'sweatshirts'],
      Jacket: ['jacket', 'jackets'],
      Shirt: ['shirt', 'shirts'],
    };

    const isGenericToCategory =
      bestCategory &&
      GENERIC_CATEGORY_TOKENS[bestCategory]?.some(tok => matchWithWordBoundary(normalizedQuery, tok));

    const isMultiWordKeyword = matchedKeyword && matchedKeyword.trim().split(/\s+/).length > 1;
    const shouldAcceptSubcategory = matchedKeyword && (!isGenericToCategory || isMultiWordKeyword);

    if (shouldAcceptSubcategory) {
      filters.subcategory = bestSubcategory;
      filters.isSubcategoryMatch = true;
    }

    if (filters.isSubcategoryMatch && bestCategory) {
      const categorySubcategories = PRODUCT_SUBCATEGORIES[bestCategory] || [];
      if (!categorySubcategories.includes(bestSubcategory)) {
        filters.subcategory = null;
        filters.isSubcategoryMatch = false;
      }
    }
  }

  for (const [color, variations] of Object.entries(COLOR_KEYWORDS)) {
    const colorMatch = variations.some(variation =>
      words.includes(variation) || matchWithWordBoundary(normalizedQuery, variation)
    );

    if (colorMatch) {
      filters.color = color;
      break;
    }
  }

  if (!filters.isDirectCategoryMatch && !filters.isSubcategoryMatch) {
    for (const [style, config] of Object.entries(STYLE_KEYWORDS)) {
      const styleMatch = config.keywords.some(keyword =>
        matchWithWordBoundary(normalizedQuery, keyword)
      );

      if (styleMatch) {
        filters.style = style;
        filters.categories = config.categories;
        filters.isStyleSearch = true;
        break;
      }
    }
  }

  if (!filters.category && !filters.subcategory && !filters.style) {
    filters.searchTerm = query;
  }

  return filters;
};

export const unifiedSearch = async ({
  query = null,
  category = null,
  subcategory = null,
  color = null,
  sort = 'popularity',
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT
}) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  const offset = (p - 1) * l;
  const hasExplicitFilters = category || subcategory || color;

  let filters = {};
  let searchMode = 'explicit';

  if (query && !hasExplicitFilters) {
    filters = parseSearchQuery(query);
    searchMode = 'smart';
  } else if (hasExplicitFilters) {
    filters = {
      category: category || null,
      subcategory: subcategory || null,
      color: color || null,
      isDirectCategoryMatch: !!category,
      isSubcategoryMatch: !!subcategory,
      isStyleSearch: false,
      searchTerm: query
    };

    if (query) {
      const smartFilters = parseSearchQuery(query);

      if (!filters.category && smartFilters.category) {
        filters.category = smartFilters.category;
        filters.isDirectCategoryMatch = smartFilters.isDirectCategoryMatch;
      }

      if (!filters.subcategory && smartFilters.subcategory) {
        filters.subcategory = smartFilters.subcategory;
        filters.isSubcategoryMatch = smartFilters.isSubcategoryMatch;
      }

      if (!filters.color && smartFilters.color) {
        filters.color = smartFilters.color;
      }
    }

    searchMode = 'filtered';
  } else {
    filters = {};
    searchMode = 'browse';
  }

  let dbQuery = supabaseAdmin
    .from('products')
    .select('id, name, description, price, brand, images, category, subcategory, color, affiliate_link, popularity, clicks, created_at', {
      count: 'exact'
    });

  if (hasExplicitFilters) {
    if (filters.subcategory) {
      dbQuery = dbQuery.eq('subcategory', filters.subcategory);
    } else if (filters.category) {
      dbQuery = dbQuery.eq('category', filters.category);
    }

    if (filters.color) {
      dbQuery = dbQuery.eq('color', filters.color);
    }

    if (query && query.trim()) {
      const redundant = isQueryRedundantWithFilters(query, filters.category, filters.subcategory, filters.color);
      if (!redundant) {
        const searchTerm = query.trim();
        dbQuery = dbQuery.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
    }
  } else {
    if (filters.isSubcategoryMatch && filters.subcategory) {
      dbQuery = dbQuery.eq('subcategory', filters.subcategory);
    } else if (filters.isDirectCategoryMatch && filters.category) {
      dbQuery = dbQuery.eq('category', filters.category);
    } else if (filters.isStyleSearch && filters.categories && filters.categories.length > 0) {
      const validCategories = filters.categories.filter(cat => PRODUCT_CATEGORIES.includes(cat));
      if (validCategories.length > 0) {
        dbQuery = dbQuery.in('category', validCategories);
      }
    }

    if (filters.color) {
      dbQuery = dbQuery.eq('color', filters.color);
    }

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.trim();
      dbQuery = dbQuery.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
  }

  dbQuery = applySorting(dbQuery, sort);
  dbQuery = dbQuery.range(offset, offset + l - 1);

  const { data: products, error, count } = await dbQuery;

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  let banners = [];
  const appliedCategory = filters.category || category;

  if (appliedCategory) {
    const { data: categoryBanners } = await supabaseAdmin
      .from('category_banners')
      .select('id, banner_image, link, title, display_order')
      .eq('category', appliedCategory)
      .order('display_order', { ascending: true });

    banners = categoryBanners || [];
  }

  return {
    products: products || [],
    banners,
    total: count || 0,
    page: p,
    limit: l,
    totalPages: Math.ceil((count || 0) / l),
    searchMode,
    filters: {
      appliedCategory: appliedCategory || null,
      appliedSubcategory: filters.subcategory || subcategory || null,
      appliedColor: filters.color || color || null,
      appliedSort: sort,
      appliedStyle: filters.style || null,
      appliedCategories: filters.categories || [],
      searchType: hasExplicitFilters ? 'explicit' :
        filters.isSubcategoryMatch ? 'subcategory' :
          filters.isDirectCategoryMatch ? 'category' :
            filters.isStyleSearch ? 'style' :
              query ? 'text' : 'browse'
    },
    metadata: {
      query,
      explicitFilters: { category, subcategory, color },
      parsedFilters: searchMode === 'smart' ? filters : null
    }
  };
};

const applySorting = (query, sort) => {
  switch (sort) {
    case 'popularity':
      return query.order('popularity', { ascending: false }).order('created_at', { ascending: false });
    case 'price_asc':
      return query.order('price', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false });
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'oldest':
      return query.order('created_at', { ascending: true });
    case 'clicks':
      return query.order('clicks', { ascending: false });
    default:
      return query.order('popularity', { ascending: false }).order('created_at', { ascending: false });
  }
};

export const smartSearch = async ({ query, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  return unifiedSearch({ query, page: p, limit: l });
};

export const getSearchSuggestions = async (partialQuery) => {
  const normalizedQuery = partialQuery.toLowerCase().trim();
  const suggestions = { categories: [], colors: [], styles: [], products: [] };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => kw.startsWith(normalizedQuery) || kw.includes(normalizedQuery))) {
      suggestions.categories.push(category);
    }
  }

  for (const [color, variations] of Object.entries(COLOR_KEYWORDS)) {
    if (variations.some(v => v.startsWith(normalizedQuery) || v.includes(normalizedQuery))) {
      if (!suggestions.colors.includes(color)) suggestions.colors.push(color);
    }
  }

  for (const [style, config] of Object.entries(STYLE_KEYWORDS)) {
    if (config.keywords.some(kw => kw.startsWith(normalizedQuery) || kw.includes(normalizedQuery))) {
      suggestions.styles.push({ name: style, description: config.description });
    }
  }

  if (normalizedQuery.length >= 2) {
    try {
      const { data } = await supabaseAdmin
        .from('products')
        .select('name, brand')
        .or(`name.ilike.%${normalizedQuery}%,brand.ilike.%${normalizedQuery}%`)
        .limit(5);

      if (data?.length) {
        const names = new Set();
        const brands = new Set();

        data.forEach(p => {
          if (p.name?.toLowerCase().includes(normalizedQuery)) names.add(p.name);
          if (p.brand?.toLowerCase().includes(normalizedQuery)) brands.add(p.brand);
        });

        suggestions.products = [
          ...Array.from(names).slice(0, 3),
          ...Array.from(brands).slice(0, 2)
        ].slice(0, 5);
      }
    } catch (err) {
      throw new Error('Failed to fetch product suggestions');
    }
  }

  return suggestions;
};

export const advancedSearch = async ({
  query = null,
  category = null,
  subcategory = null,
  color = null,
  minPrice = null,
  maxPrice = null,
  brand = null,
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT
}) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  const offset = (p - 1) * l;

  let dbQuery = supabaseAdmin
    .from('products')
    .select('id, name, description, price, brand, images, category, subcategory, color, affiliate_link, popularity, clicks, created_at', { count: 'exact' });

  if (category) dbQuery = dbQuery.eq('category', category);
  if (subcategory) dbQuery = dbQuery.eq('subcategory', subcategory);
  if (color) dbQuery = dbQuery.eq('color', color);
  if (brand) dbQuery = dbQuery.ilike('brand', `%${brand}%`);
  if (minPrice) dbQuery = dbQuery.gte('price', minPrice);
  if (maxPrice) dbQuery = dbQuery.lte('price', maxPrice);
  if (query?.trim()) {
    dbQuery = dbQuery.or(`name.ilike.%${query.trim()}%,brand.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`);
  }

  dbQuery = dbQuery
    .range(offset, offset + l - 1)
    .order('popularity', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error, count } = await dbQuery;

  if (error) {
    throw new Error(`Advanced search failed: ${error.message}`);
  }

  return {
    products: data || [],
    total: count || 0,
    page: p,
    limit: l,
    totalPages: Math.ceil((count || 0) / l),
    appliedFilters: {
      query,
      category,
      subcategory,
      color,
      brand,
      priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null
    }
  };
};
