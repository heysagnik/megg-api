import { supabaseAdmin } from '../config/supabase.js';
import { COLOR_KEYWORDS, STYLE_KEYWORDS, CATEGORY_KEYWORDS, SUBCATEGORY_KEYWORDS, BRAND_KEYWORDS } from '../config/searchKeywords.js';
import { PRODUCT_SUBCATEGORIES, PRODUCT_CATEGORIES } from '../config/constants.js';
import { PAGINATION } from '../config/constants.js';
import logger from '../utils/logger.js';

// --- Helpers ---

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const matchWithWordBoundary = (text, keyword) => {
  const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(text);
};

const isFuzzyMatch = (text, keyword) => {
  const textLower = text.toLowerCase();
  const keywordLower = keyword.toLowerCase();

  // 1. Exact/Prefix/Word Boundary
  if (matchWithWordBoundary(textLower, keywordLower)) return true;
  if (textLower.includes(keywordLower)) return true;

  // 2. Levenshtein Distance
  // Allow 1 edit for words > 3 chars, 2 edits for words > 6 chars
  const distance = levenshteinDistance(textLower, keywordLower);
  const allowedDistance = keywordLower.length > 6 ? 2 : keywordLower.length > 3 ? 1 : 0;

  return distance <= allowedDistance;
};

const isQueryRedundantWithFilters = (query, category, subcategory) => {
  if (!query) return true;
  const q = String(query).toLowerCase().trim();
  if (!q) return true;

  if (subcategory && SUBCATEGORY_KEYWORDS[subcategory]) {
    const subKw = SUBCATEGORY_KEYWORDS[subcategory];
    if (subKw?.some(kw => isFuzzyMatch(q, String(kw).toLowerCase()))) {
      return true;
    }
    if (isFuzzyMatch(q, subcategory.toLowerCase())) return true;
  }

  if (category && CATEGORY_KEYWORDS[category]) {
    const catKw = CATEGORY_KEYWORDS[category];
    if (catKw?.some(kw => isFuzzyMatch(q, String(kw).toLowerCase()))) {
      return true;
    }
    if (isFuzzyMatch(q, category.toLowerCase())) return true;
  }

  return false;
};

const findBestCategoryMatch = (queryWords) => {
  const scores = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();

      // Check against each word in query
      queryWords.forEach((word, index) => {
        if (!word) return;

        // Exact/Prefix/Boundary
        if (matchWithWordBoundary(word, keywordLower)) {
          scores.push({ category, score: 80, keyword, matchedIndex: index });
          return;
        }

        // Fuzzy
        if (word.length >= 3) {
          const distance = levenshteinDistance(word, keywordLower);
          const allowed = keywordLower.length > 5 ? 2 : 1;
          if (distance <= allowed) {
            scores.push({ category, score: 60 - (distance * 10), keyword, matchedIndex: index });
          }
        }
      });
    }
  }

  if (scores.length === 0) return null;

  scores.sort((a, b) => b.score - a.score);
  return scores[0];
};

const findBestSubcategoryMatch = (queryWords, category = null) => {
  const subcategoryScores = [];

  for (const [subcategory, keywords] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    let categoryMatch = false;
    if (category) {
      const categorySubcategories = PRODUCT_SUBCATEGORIES[category] || [];
      categoryMatch = categorySubcategories.includes(subcategory);
    }

    if (!categoryMatch && category) continue;

    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      const keywordLower = keyword.toLowerCase();

      queryWords.forEach((word, index) => {
        if (!word) return;

        let matchScore = 0;

        if (word === keywordLower) {
          matchScore = 10000;
        } else if (matchWithWordBoundary(word, keywordLower)) {
          matchScore = 5000;
        } else if (word.length >= 3) {
          const distance = levenshteinDistance(word, keywordLower);
          const allowed = keywordLower.length > 5 ? 2 : 1;
          if (distance <= allowed) {
            matchScore = 3000 - (distance * 500);
          }
        }

        if (matchScore > 0) {
          if (categoryMatch) matchScore += 100000;
          subcategoryScores.push({
            subcategory,
            score: matchScore,
            keyword,
            matchedIndex: index,
            categoryMatch
          });
        }
      });
    }
  }

  if (subcategoryScores.length === 0) return null;

  subcategoryScores.sort((a, b) => b.score - a.score);
  return subcategoryScores[0];
};

export const parseSearchQuery = (query) => {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  const usedIndices = new Set();

  const filters = {
    category: null,
    subcategory: null,
    color: null,
    style: null,
    brand: null,
    categories: [],
    searchTerm: null,
    isDirectCategoryMatch: false,
    isSubcategoryMatch: false,
    isStyleSearch: false,
    isBrandMatch: false
  };

  // Helper to get unused words
  const getUnusedWords = () => words.map((w, i) => usedIndices.has(i) ? null : w);

  // 1. Extract Color (Fuzzy)
  for (const [color, variations] of Object.entries(COLOR_KEYWORDS)) {
    let foundColor = false;
    words.forEach((word, index) => {
      if (usedIndices.has(index)) return;

      const isMatch = variations.some(v => {
        if (word === v) return true;
        if (word.length >= 3) {
          const dist = levenshteinDistance(word, v);
          return dist <= (v.length > 4 ? 1 : 0);
        }
        return false;
      });

      if (isMatch) {
        filters.color = color;
        usedIndices.add(index);
        foundColor = true;
      }
    });
    if (foundColor) break;
  }

  for (const [brand, variations] of Object.entries(BRAND_KEYWORDS)) {
    let foundBrand = false;
    const unusedQuery = getUnusedWords().filter(Boolean).join(' ');
    for (const v of variations) {
      if (isFuzzyMatch(unusedQuery, v)) {
        filters.brand = brand;
        filters.isBrandMatch = true;

        const vWords = v.split(/\s+/);
        let matchCount = 0;
        words.forEach((word, index) => {
          if (usedIndices.has(index)) return;
          if (matchCount < vWords.length && isFuzzyMatch(word, vWords[matchCount])) {
            usedIndices.add(index);
            matchCount++;
          }
        });
        foundBrand = true;
        break;
      }
    }
    if (foundBrand) break;
  }

  const bestCategoryMatch = findBestCategoryMatch(getUnusedWords());
  if (bestCategoryMatch) {
    filters.category = bestCategoryMatch.category;
    filters.isDirectCategoryMatch = true;
    usedIndices.add(bestCategoryMatch.matchedIndex);
  }

  const bestSubMatch = findBestSubcategoryMatch(getUnusedWords(), filters.category);
  if (bestSubMatch) {
    const { subcategory, matchedIndex } = bestSubMatch;

    let isValid = true;
    if (filters.category) {
      const validSubs = PRODUCT_SUBCATEGORIES[filters.category] || [];
      if (!validSubs.includes(subcategory)) isValid = false;
    }

    if (isValid) {
      filters.subcategory = subcategory;
      filters.isSubcategoryMatch = true;
      usedIndices.add(matchedIndex);
    }
  }

  if (!filters.category && !filters.subcategory) {
    for (const [style, config] of Object.entries(STYLE_KEYWORDS)) {
      let foundStyle = false;
      words.forEach((word, index) => {
        if (usedIndices.has(index)) return;
        if (config.keywords.some(k => isFuzzyMatch(word, k))) {
          filters.style = style;
          filters.categories = config.categories;
          filters.isStyleSearch = true;
          usedIndices.add(index);
          foundStyle = true;
        }
      });
      if (foundStyle) break;
    }
  }

  const remainingWords = words.filter((_, i) => !usedIndices.has(i));
  filters.searchTerm = remainingWords.length > 0 ? remainingWords.join(' ') : null;

  return filters;
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
    default:
      return query.order('popularity', { ascending: false }).order('created_at', { ascending: false });
  }
};

export const unifiedSearch = async ({
  query = null,
  category = null,
  subcategory = null,
  color = null,
  brand = null,
  sort = 'popularity',
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT
}) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  const offset = (p - 1) * l;
  const hasExplicitFilters = category || subcategory || color || brand;

  let filters = {};
  let searchMode = 'explicit';

  // --- Parsing Logic ---
  if (query && !hasExplicitFilters) {
    filters = parseSearchQuery(query);
    searchMode = 'smart';
  } else if (hasExplicitFilters) {
    filters = {
      category: category || null,
      subcategory: subcategory || null,
      color: color || null,
      brand: brand || null,
      searchTerm: query
    };

    if (query) {
      const smartFilters = parseSearchQuery(query);
      if (!filters.category && smartFilters.category) filters.category = smartFilters.category;
      if (!filters.subcategory && smartFilters.subcategory) filters.subcategory = smartFilters.subcategory;
      if (!filters.color && smartFilters.color) filters.color = smartFilters.color;
      if (!filters.brand && smartFilters.brand) filters.brand = smartFilters.brand;
    }
    searchMode = 'filtered';
  } else {
    filters = {};
    searchMode = 'browse';
  }

  // --- Base Query Construction ---
  const buildQuery = (searchFilters, isRelaxed = false) => {
    let dbQuery = supabaseAdmin
      .from('products')
      .select('id, name, description, price, brand, images, category, subcategory, color, affiliate_link, popularity, clicks, created_at', {
        count: 'exact'
      });

    // Apply Filters
    if (searchFilters.subcategory) dbQuery = dbQuery.eq('subcategory', searchFilters.subcategory);
    else if (searchFilters.category) dbQuery = dbQuery.eq('category', searchFilters.category);
    else if (searchFilters.isStyleSearch && searchFilters.categories?.length) {
      const validCategories = searchFilters.categories.filter(cat => PRODUCT_CATEGORIES.includes(cat));
      if (validCategories.length) dbQuery = dbQuery.in('category', validCategories);
    }

    if (searchFilters.color) dbQuery = dbQuery.eq('color', searchFilters.color);
    if (searchFilters.brand) dbQuery = dbQuery.ilike('brand', `%${searchFilters.brand}%`);

    // Apply Text Search
    const term = searchFilters.searchTerm;
    if (term && term.trim()) {
      const cleanTerm = term.replace(/[|&:*!]/g, ' ').trim();
      if (cleanTerm) {
        if (isRelaxed) {
          // Relaxed: OR logic between terms
          const formattedQuery = cleanTerm.split(/\s+/).map(w => `'${w}'`).join(' | ');
          dbQuery = dbQuery.textSearch('search_vector', formattedQuery, { config: 'english' });
        } else {
          // Strict: Prefix match (AND logic implied by FTS usually, but let's be explicit or use prefix)
          // Using prefix match for each term: 'term1':* & 'term2':*
          // ESCAPE SINGLE QUOTES: pond's -> pond''s
          const formattedQuery = cleanTerm.split(/\s+/).map(w => `'${w.replace(/'/g, "''")}':*`).join(' & ');
          dbQuery = dbQuery.filter('search_vector', 'fts', formattedQuery);
        }
      }
    }

    return dbQuery;
  };

  // --- Execute Strict Search ---
  let dbQuery = buildQuery(filters, false);
  dbQuery = applySorting(dbQuery, sort);
  dbQuery = dbQuery.range(offset, offset + l - 1);

  const productsPromise = dbQuery.then(({ data, error, count }) => {
    if (error) throw new Error(`Search failed: ${error.message}`);
    return { data, count };
  });

  // --- Fetch Banners (Parallel) ---
  const appliedCategory = filters.category || category;
  let bannersPromise = Promise.resolve([]);

  if (appliedCategory) {
    bannersPromise = supabaseAdmin
      .from('category_banners')
      .select('id, banner_image, link, title, display_order')
      .eq('category', appliedCategory)
      .order('display_order', { ascending: true })
      .then(({ data }) => data || []);
  }

  let [{ data: products, count }, banners] = await Promise.all([productsPromise, bannersPromise]);

  let isFuzzyFallback = false;

  // --- Execute Relaxed Fallback (if needed) ---
  if ((!products || products.length === 0) && filters.searchTerm && !hasExplicitFilters) {
    // Only fallback if we relied on text search and got nothing
    // And we didn't have explicit filters (which user might expect strictness on)
    const relaxedQuery = buildQuery(filters, true); // isRelaxed = true
    const { data: relaxedProducts, error: relaxedError, count: relaxedCount } = await relaxedQuery
      .range(offset, offset + l - 1)
      .order('popularity', { ascending: false });

    if (!relaxedError && relaxedProducts?.length > 0) {
      products = relaxedProducts;
      count = relaxedCount;
      isFuzzyFallback = true;
    }
  }

  return {
    products: products || [],
    banners,
    total: count || 0,
    page: p,
    limit: l,
    totalPages: Math.ceil((count || 0) / l),
    searchMode: isFuzzyFallback ? 'fuzzy_fallback' : searchMode,
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
      explicitFilters: { category, subcategory, color, brand },
      parsedFilters: searchMode === 'smart' ? filters : null,
      isFuzzyMatch: isFuzzyFallback
    }
  };
};

export const smartSearch = async ({ query, page = 1, limit = PAGINATION.DEFAULT_LIMIT }) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  return unifiedSearch({ query, page: p, limit: l });
};

export const getSearchSuggestions = async (partialQuery) => {
  if (!partialQuery || partialQuery.trim().length < 2) {
    return { categories: [], colors: [], styles: [], products: [], top_queries: [] };
  }

  const normalizedQuery = partialQuery.toLowerCase().trim();
  const suggestions = {
    top_queries: [],
    categories: [],
    colors: [],
    styles: [],
    products: []
  };

  // 1. Parse the query to see what we already understand
  const parsed = parseSearchQuery(partialQuery);

  // 2. Fetch relevant products to generate "Predictive Queries" based on actual inventory
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('name, brand, category, subcategory, color, popularity')
      .textSearch('search_vector', `${normalizedQuery}:*`, {
        config: 'english',
        type: 'plain'
      })
      .order('popularity', { ascending: false })
      .limit(20); // Fetch enough to find patterns

    if (products?.length) {
      // A. Generate Product Suggestions (Names/Brands)
      const names = new Set();
      products.forEach(p => {
        if (p.name) names.add(p.name);
      });
      suggestions.products = Array.from(names).slice(0, 5);

      // B. Generate Predictive "Top Queries"
      // We look for common patterns in the results:
      // - "{Color} {Subcategory}" (e.g., "Black Hoodies")
      // - "{Brand} {Subcategory}" (e.g., "Nike Shoes")
      // - "{Subcategory}" (if query matches prefix)

      const patterns = new Map();

      products.forEach(p => {
        const sub = p.subcategory || p.category;
        if (!sub) return;

        // Pattern 1: Color + Subcategory
        if (p.color) {
          const query = `${p.color} ${sub}`;
          // Only suggest if it adds value to the user's current input
          // or if the user's input matches part of it
          if (query.toLowerCase().includes(normalizedQuery) || isFuzzyMatch(query, normalizedQuery)) {
            patterns.set(query, (patterns.get(query) || 0) + p.popularity);
          }
        }

        // Pattern 2: Brand + Subcategory
        if (p.brand) {
          const query = `${p.brand} ${sub}`;
          if (query.toLowerCase().includes(normalizedQuery)) {
            patterns.set(query, (patterns.get(query) || 0) + p.popularity);
          }
        }

        // Pattern 3: Just Subcategory (if it matches query prefix)
        if (sub.toLowerCase().includes(normalizedQuery)) {
          patterns.set(sub, (patterns.get(sub) || 0) + p.popularity);
        }
      });

      // Sort patterns by score (popularity sum)
      const sortedPatterns = Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 3);

      suggestions.top_queries = sortedPatterns.map(q => ({
        query: q,
        label: q // Simple label for now
      }));
    }
  } catch (err) {
    logger.error(`Suggestion fetch failed: ${err.message}`);
  }

  // 3. Fallback: If no dynamic patterns found, use the parsed query construction
  if (suggestions.top_queries.length === 0) {
    const parts = [];
    if (parsed.brand) parts.push(parsed.brand);
    if (parsed.color) parts.push(parsed.color);
    if (parsed.subcategory) parts.push(parsed.subcategory);
    else if (parsed.category) parts.push(parsed.category);
    if (parsed.searchTerm) parts.push(parsed.searchTerm);

    const constructedQuery = parts.join(' ');
    if (constructedQuery && constructedQuery.toLowerCase() !== normalizedQuery) {
      suggestions.top_queries.push({
        query: constructedQuery,
        label: constructedQuery
      });
    }
  }

  // 4. Static Data Suggestions (Fuzzy) - Keep these for categorization
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => isFuzzyMatch(normalizedQuery, kw))) {
      if (!suggestions.categories.includes(category)) suggestions.categories.push(category);
    }
  }

  for (const [color, variations] of Object.entries(COLOR_KEYWORDS)) {
    if (variations.some(v => isFuzzyMatch(normalizedQuery, v))) {
      if (!suggestions.colors.includes(color)) suggestions.colors.push(color);
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
  if (brand) dbQuery = dbQuery.ilike('brand', `%${brand}%`); // Brand usually doesn't have FTS index, keep ilike or use FTS if indexed
  if (minPrice) dbQuery = dbQuery.gte('price', minPrice);
  if (maxPrice) dbQuery = dbQuery.lte('price', maxPrice);

  if (query?.trim()) {
    const cleanTerm = query.replace(/[|&:*!]/g, ' ').trim();
    if (cleanTerm) {
      const formattedQuery = cleanTerm.split(/\s+/).map(w => `'${w.replace(/'/g, "''")}':*`).join(' & ');
      dbQuery = dbQuery.filter('search_vector', 'fts', formattedQuery);
    }
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
