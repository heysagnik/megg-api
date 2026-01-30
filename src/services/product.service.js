import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { productDataSchemaRaw, listProductsParamsRaw } from '../validators/product.validators.js';
import { OCCASION_MAP } from '../config/searchMappings.js';
import { getCached, invalidateCacheByPrefix, CACHE_TTL } from '../utils/cache.js';

const FABRIC_PROPERTIES = {
  breathable: ['cotton', 'linen', 'mesh', 'bamboo', 'rayon'],
  warm: ['wool', 'fleece', 'cashmere', 'thermal', 'velvet'],
  stretchy: ['spandex', 'elastane', 'lycra', 'stretch'],
  durable: ['denim', 'canvas', 'leather', 'nylon', 'polyester'],
  luxurious: ['silk', 'cashmere', 'velvet', 'satin'],
  waterproof: ['polyester', 'nylon', 'gore-tex'],
};

const generateSemanticTags = (product) => {
  const tags = new Set();
  const { category, subcategory, brand, color, name = '', description = '', price } = product;

  if (category) {
    tags.add(category.toLowerCase().replace(/\s+/g, '-'));
    tags.add(category.toLowerCase());
  }
  if (subcategory) {
    tags.add(subcategory.toLowerCase().replace(/\s+/g, '-'));
    tags.add(subcategory.toLowerCase());
  }
  if (brand) tags.add(brand.toLowerCase());
  if (color) tags.add(color.toLowerCase().trim());

  Object.entries(OCCASION_MAP || {}).forEach(([occasion, config]) => {
    if (config.categories?.includes(category)) {
      tags.add(occasion);
      config.tags?.forEach(t => tags.add(t));
    }
  });

  const winterItems = ['jacket', 'puffer', 'hoodie', 'sweater', 'thermal', 'fleece', 'coat'];
  const summerItems = ['shorts', 'linen', 'half-sleeve', 'tank', 't-shirt', 'polo'];
  const subLower = subcategory?.toLowerCase() || '';
  const catLower = category?.toLowerCase() || '';
  if (winterItems.some(w => subLower.includes(w) || catLower.includes(w))) tags.add('winter');
  if (summerItems.some(s => subLower.includes(s) || catLower.includes(s))) tags.add('summer');

  const text = `${name} ${description}`.toLowerCase();
  Object.entries(FABRIC_PROPERTIES || {}).forEach(([property, fabrics]) => {
    if (fabrics.some(f => text.includes(f))) {
      tags.add(property);
      fabrics.filter(f => text.includes(f)).forEach(f => tags.add(f));
    }
  });

  const colorLower = color?.toLowerCase() || '';
  if (['black', 'grey', 'gray', 'white', 'beige', 'brown'].includes(colorLower)) tags.add('neutral');
  if (['black', 'navy', 'charcoal'].includes(colorLower)) tags.add('dark');

  const priceNum = parseFloat(price) || 0;
  if (priceNum < 500) tags.add('budget-friendly');
  else if (priceNum < 1500) tags.add('mid-range');
  else tags.add('premium');

  return Array.from(tags).filter(t => t && t.length > 1);
};

const generateEmbedding = async (product) => {
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  const CF_API_TOKEN = process.env.CF_API_TOKEN;

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    return null;
  }

  try {
    const { name = '', brand = '', category = '', subcategory = '', color = '', description = '' } = product;
    const textForEmbedding = `${name} ${brand} ${category} ${subcategory} ${color} ${description}`.trim().substring(0, 500);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-small-en-v1.5`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [textForEmbedding] }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.result?.data?.[0]) {
      return `[${data.result.data[0].join(',')}]`;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const buildQuery = (baseQuery, conditions, orderBy, limit, offset) => {
  let query = baseQuery;
  const values = [];
  let paramCounter = 1;

  if (conditions.length > 0) {
    const whereClauses = conditions.map(c => {
      if (c.value !== undefined) {
        values.push(c.value);
        return c.clause.replace('?', `$${paramCounter++}`);
      }
      return c.clause;
    });
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (orderBy) {
    query += ` ${orderBy}`;
  }

  if (limit !== undefined) {
    query += ` LIMIT $${paramCounter++}`;
    values.push(limit);
  }

  if (offset !== undefined) {
    query += ` OFFSET $${paramCounter++}`;
    values.push(offset);
  }

  return { query, values };
};

export const listProducts = async (params) => {
  const validation = listProductsParamsRaw.safeParse(params);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { category, subcategory, color, search, sort, page, limit } = validation.data;
  const cacheKey = `products:list:${category || 'all'}:${subcategory || 'all'}:${color || 'all'}:${search || ''}:${sort}:${page}:${limit}`;

  return getCached(cacheKey, CACHE_TTL.PRODUCT_LIST, async () => {
    const offset = (page - 1) * limit;

    let orderBy = 'ORDER BY created_at DESC';
    switch (sort) {
      case 'popularity': orderBy = 'ORDER BY popularity DESC'; break;
      case 'price_asc': orderBy = 'ORDER BY price ASC'; break;
      case 'price_desc': orderBy = 'ORDER BY price DESC'; break;
      case 'oldest': orderBy = 'ORDER BY created_at ASC'; break;
      case 'newest': orderBy = 'ORDER BY created_at DESC'; break;
    }

    const conditions = [{ clause: 'is_active = TRUE' }];
    if (category) conditions.push({ clause: 'category = ?', value: category });
    if (subcategory) conditions.push({ clause: 'subcategory = ?', value: subcategory });
    if (color) conditions.push({ clause: 'color = ?', value: color });
    if (search) conditions.push({ clause: "search_vector @@ plainto_tsquery('english', ?)", value: search });

    const listQ = buildQuery(
      'SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link FROM products',
      conditions,
      orderBy,
      limit,
      offset
    );

    const countQ = buildQuery(
      'SELECT COUNT(*)::int FROM products',
      conditions
    );

    const [products, countResult] = await Promise.all([
      sql(listQ.query, listQ.values),
      sql(countQ.query, countQ.values)
    ]);

    const count = countResult[0]?.count || 0;

    return {
      products,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  });
};

export const browseByCategory = async (params) => {
  const validation = listProductsParamsRaw.safeParse(params);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { category, subcategory, color, sort, page, limit } = validation.data;

  if (!category) throw new ValidationError('Category is required');

  const cacheKey = `products:browse:${category}:${subcategory || 'all'}:${color || 'all'}:${sort}:${page}:${limit}`;

  return getCached(cacheKey, CACHE_TTL.PRODUCT_LIST, async () => {
    const offset = (page - 1) * limit;

    let orderBy = 'ORDER BY popularity DESC';
    switch (sort) {
      case 'price_asc': orderBy = 'ORDER BY price ASC'; break;
      case 'price_desc': orderBy = 'ORDER BY price DESC'; break;
      case 'oldest': orderBy = 'ORDER BY created_at ASC'; break;
      case 'newest': orderBy = 'ORDER BY created_at DESC'; break;
    }

    const conditions = [{ clause: 'category = ?', value: category }];
    if (subcategory) conditions.push({ clause: 'subcategory = ?', value: subcategory });
    if (color) conditions.push({ clause: 'color = ?', value: color });

    const listQ = buildQuery(
      'SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link FROM products',
      conditions,
      orderBy,
      limit,
      offset
    );

    const countQ = buildQuery('SELECT COUNT(*)::int FROM products', conditions);

    const [products, countResult, banners] = await Promise.all([
      sql(listQ.query, listQ.values),
      sql(countQ.query, countQ.values),
      sql('SELECT id, banner_image, link, display_order FROM category_banners WHERE category = $1 ORDER BY display_order ASC', [category])
    ]);

    const count = countResult[0]?.count || 0;

    return {
      category,
      banners: banners || [],
      products: products || [],
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      appliedFilters: { subcategory, color, sort }
    };
  });
};

export const getProductById = async (id) => {
  const cacheKey = `product:${id}`;

  const result = await getCached(cacheKey, CACHE_TTL.PRODUCT_DETAIL, async () => {
    const [product] = await sql(
      `SELECT id, name, description, price, brand, images, category, subcategory, color, fabric, affiliate_link, is_active, clicks, popularity, created_at, updated_at
       FROM products
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!product) {
      return null;
    }

    const [variants, recommended] = await Promise.all([
      sql(
        `SELECT id, color, images
         FROM products
         WHERE brand = $1
         AND name ILIKE $2
         AND id != $3
         AND is_active = true
         LIMIT 10`,
        [product.brand, product.name, id]
      ),
      sql(
        `SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link
         FROM products
         WHERE id != $1
         AND is_active = true
         AND (
           ($2::text IS NOT NULL AND subcategory::text = $2) OR
           ($2::text IS NULL AND category::text = $3)
         )
         ORDER BY popularity DESC
         LIMIT 8`,
        [id, product.subcategory, product.category]
      )
    ]);

    return { product, variants, recommended };
  });

  if (!result || !result.product) {
    throw new NotFoundError('Product not found');
  }

  sql('UPDATE products SET popularity = popularity + 1 WHERE id = $1', [id]).catch(() => {});

  return result;
};

export const incrementProductClicks = async (id) => {
  await sql('SELECT increment_product_clicks($1)', [id]);
};

export const getRecommendedProducts = async (fabricTypes, excludeId) => {
  if (!fabricTypes || fabricTypes.length === 0) return [];

  const cacheKey = `recs:${excludeId}:${fabricTypes.join(',')}`;

  return getCached(cacheKey, CACHE_TTL.RECOMMENDATIONS, async () => {
    return await sql(
      `SELECT id, name, price, brand, images, color, category, subcategory
       FROM products
       WHERE id != $1
       AND color = ANY($2) 
       LIMIT 6`,
      [excludeId, fabricTypes]
    );
  });
};

export const getRelatedProducts = async (id) => {
  const cacheKey = `related:${id}`;

  return getCached(cacheKey, CACHE_TTL.RECOMMENDATIONS, async () => {
    const [product] = await sql('SELECT category FROM products WHERE id = $1', [id]);
    if (!product) throw new NotFoundError('Product not found');

    return await sql(
      `SELECT id, name, price, brand, images, color, category, subcategory
       FROM products
       WHERE category = $1
       AND id != $2
       ORDER BY popularity DESC
       LIMIT 8`,
      [product.category, id]
    );
  });
};

export const createProduct = async (productData) => {
  const validation = productDataSchemaRaw.safeParse(productData);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const validData = validation.data;
  if (typeof validData.fabric === 'string') {
    try {
      if (validData.fabric.startsWith('[')) {
        validData.fabric = JSON.parse(validData.fabric);
      } else {
        validData.fabric = [validData.fabric];
      }
    } catch (e) {
      validData.fabric = [validData.fabric];
    }
  }

  validData.semantic_tags = generateSemanticTags(validData);

  try {
    const keys = Object.keys(validData);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => validData[k]);

    const [newProduct] = await sql(`
      INSERT INTO products (${cols}) VALUES (${vals})
      RETURNING *
    `, values);

    invalidateCacheByPrefix('products:').catch(() => {});

    generateEmbedding(newProduct).then(embedding => {
      if (embedding) {
        sql('UPDATE products SET embedding = $1::vector WHERE id = $2', [embedding, newProduct.id])
          .catch(() => {});
      }
    }).catch(() => {});

    return newProduct;
  } catch (error) {
    if (error.code === '23505') throw new Error('A product with this identifier already exists.');
    throw new Error(`Failed to create product: ${error.message}`);
  }
};

export const updateProduct = async (id, updates, newFiles = []) => {
  const validation = productDataSchemaRaw.partial().safeParse(updates);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const [existingProduct] = await sql('SELECT images FROM products WHERE id = $1', [id]);

  if (!existingProduct) throw new NotFoundError('Product not found');

  const validUpdates = validation.data;

  if (validUpdates.fabric !== undefined) {
    if (typeof validUpdates.fabric === 'string') {
      if (validUpdates.fabric === '') {
        delete validUpdates.fabric;
      } else {
        try {
          if (validUpdates.fabric.startsWith('[')) {
            validUpdates.fabric = JSON.parse(validUpdates.fabric);
          } else {
            validUpdates.fabric = [validUpdates.fabric];
          }
        } catch (e) {
          validUpdates.fabric = [validUpdates.fabric];
        }
      }
    }
  }

  if (updates.images !== undefined || newFiles.length > 0) {
    const currentImages = existingProduct.images || [];
    let keptImages = updates.images || [];

    if (!Array.isArray(keptImages)) keptImages = [keptImages];
    keptImages = keptImages.filter(url => typeof url === 'string' && url.length > 0);

    const normalizeUrl = (url) => {
      if (typeof url !== 'string') return '';
      return url.split('?')[0].trim();
    };

    const normalizedKeptImages = keptImages.map(normalizeUrl);

    const imagesToDelete = currentImages.filter(currentImg => {
      const normalizedCurrent = normalizeUrl(currentImg);
      return !normalizedKeptImages.some(keptUrl =>
        keptUrl === normalizedCurrent ||
        normalizedCurrent.includes(keptUrl) ||
        keptUrl.includes(normalizedCurrent)
      );
    });

    if (imagesToDelete.length > 0) {
      const { deleteMultipleProductImages } = await import('./upload.service.js');
      await deleteMultipleProductImages(imagesToDelete);
    }

    let newImageUrls = [];
    if (newFiles.length > 0) {
      const { uploadMultipleProductImages } = await import('./upload.service.js');
      newImageUrls = await uploadMultipleProductImages(newFiles, id);
    }

    validUpdates.images = [...keptImages, ...newImageUrls.map(u => u.medium || u.original || u)];
  }

  try {
    const shouldRegenerate = ['name', 'description', 'category', 'subcategory', 'color', 'brand', 'price']
      .some(field => validUpdates[field] !== undefined);

    if (shouldRegenerate) {
      const [fullProduct] = await sql('SELECT * FROM products WHERE id = $1', [id]);
      const mergedProduct = { ...fullProduct, ...validUpdates };
      validUpdates.semantic_tags = generateSemanticTags(mergedProduct);

      generateEmbedding(mergedProduct).then(embedding => {
        if (embedding) {
          sql('UPDATE products SET embedding = $1::vector WHERE id = $2', [embedding, id])
            .catch(() => {});
        }
      }).catch(() => {});
    }

    const dataToUpdate = { ...validUpdates, updated_at: new Date().toISOString() };
    const keys = Object.keys(dataToUpdate);
    const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
    const values = [id, ...keys.map(k => dataToUpdate[k])];

    const [updatedProduct] = await sql(`
      UPDATE products 
      SET ${setFragments.join(', ')}
      WHERE id = $1 
      RETURNING *
    `, values);

    Promise.all([
      invalidateCacheByPrefix(`product:${id}`),
      invalidateCacheByPrefix('products:')
    ]).catch(() => {});

    return updatedProduct;
  } catch (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
};

export const deleteProduct = async (id) => {
  const [product] = await sql('SELECT images FROM products WHERE id = $1', [id]);
  if (!product) throw new NotFoundError('Product not found');

  if (product.images && product.images.length > 0) {
    const { deleteMultipleProductImages } = await import('./upload.service.js');
    await deleteMultipleProductImages(product.images);
  }

  const [deleted] = await sql('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (!deleted) throw new Error('Failed to delete product');

  Promise.all([
    invalidateCacheByPrefix(`product:${id}`),
    invalidateCacheByPrefix('products:')
  ]).catch(() => {});

  return true;
};

export const getColorVariants = async (id) => {
  const cacheKey = `variants:${id}`;

  return getCached(cacheKey, CACHE_TTL.VARIANTS, async () => {
    const [product] = await sql('SELECT name, brand, subcategory, category FROM products WHERE id = $1', [id]);
    if (!product) throw new NotFoundError('Product not found');

    return await sql(
      `SELECT id, name, price, brand, images, color, category, subcategory
      FROM products
      WHERE brand = $1
      AND name ILIKE $2
      AND id != $3
      AND is_active = true
      AND (
        ($4::text IS NOT NULL AND subcategory::text = $4) OR
        ($4::text IS NULL AND category::text = $5)
      )
      LIMIT 10`,
      [product.brand, product.name, id, product.subcategory, product.category]
    );
  });
};

export const getRecommendedFromSubcategory = async (id) => {
  const cacheKey = `subrecs:${id}`;

  return getCached(cacheKey, CACHE_TTL.RECOMMENDATIONS, async () => {
    const [product] = await sql('SELECT subcategory, category FROM products WHERE id = $1', [id]);
    if (!product) throw new NotFoundError('Product not found');

    return await sql(
      `SELECT id, name, price, brand, images, color, category, subcategory, affiliate_link, popularity
      FROM products
      WHERE id != $1
      AND is_active = true
      AND (
         ($2::text IS NOT NULL AND subcategory::text = $2) OR
         ($2::text IS NULL AND category::text = $3)
      )
      ORDER BY popularity DESC
      LIMIT 12`,
      [id, product.subcategory, product.category]
    );
  });
};

export const getAllBrands = async () => {
  const cacheKey = 'brands:all';

  return getCached(cacheKey, CACHE_TTL.CATEGORIES, async () => {
    const brands = await sql(`
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
    `);

    return brands;
  });
};

export const getProductsByBrand = async (params) => {
  const { brand, category, subcategory, color, sort = 'popularity', page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const colorFilters = color ? color.split(',').map(c => c.trim()).filter(Boolean) : [];
  const cacheKey = `brand:${brand}:${category || 'all'}:${subcategory || 'all'}:${colorFilters.join(',') || 'all'}:${sort}:${page}:${limit}`;

  return getCached(cacheKey, CACHE_TTL.PRODUCT_LIST, async () => {
    const conditions = ['is_active = true', 'brand ILIKE $1'];
    const sqlParams = [`%${brand}%`];
    let paramIdx = 2;

    if (category) {
      conditions.push(`category::text ILIKE $${paramIdx++}`);
      sqlParams.push(`%${category}%`);
    }
    if (subcategory) {
      conditions.push(`subcategory::text ILIKE $${paramIdx++}`);
      sqlParams.push(`%${subcategory}%`);
    }
    if (colorFilters.length > 0) {
      const colorConditions = colorFilters.map(() => `color ILIKE $${paramIdx++}`);
      sqlParams.push(...colorFilters.map(c => `%${c}%`));
      conditions.push(`(${colorConditions.join(' OR ')})`);
    }

    const limitIdx = paramIdx++;
    const offsetIdx = paramIdx++;
    sqlParams.push(limit, offset);

    const orderBy = sort === 'price_asc' ? 'price ASC'
      : sort === 'price_desc' ? 'price DESC'
        : sort === 'newest' ? 'created_at DESC'
          : 'popularity DESC';

    const products = await sql(
      `SELECT ${SLIM_FIELDS}, COUNT(*) OVER() as full_count
       FROM products
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      sqlParams
    );

    const total = products.length > 0 ? parseInt(products[0].full_count || 0) : 0;

    const [categories, subcategories, colors] = await Promise.all([
      sql(`
        SELECT category::text as name, COUNT(*)::int as count
        FROM products
        WHERE is_active = true AND brand ILIKE $1
        GROUP BY category
        ORDER BY count DESC
      `, [`%${brand}%`]),

      category ? sql(`
        SELECT subcategory::text as name, COUNT(*)::int as count
        FROM products
        WHERE is_active = true AND brand ILIKE $1 AND category::text ILIKE $2
        GROUP BY subcategory
        HAVING subcategory IS NOT NULL AND subcategory::text != ''
        ORDER BY count DESC
        LIMIT 30
      `, [`%${brand}%`, `%${category}%`]) : Promise.resolve([]),

      sql(`
        SELECT TRIM(color) as name, COUNT(*)::int as count
        FROM products
        WHERE is_active = true AND brand ILIKE $1
        ${category ? 'AND category::text ILIKE $2' : ''}
        ${subcategory ? 'AND subcategory::text ILIKE $3' : ''}
        GROUP BY TRIM(color)
        HAVING TRIM(color) IS NOT NULL AND TRIM(color) != ''
        ORDER BY count DESC
        LIMIT 30
      `, subcategory && category ? [`%${brand}%`, `%${category}%`, `%${subcategory}%`] : category ? [`%${brand}%`, `%${category}%`] : [`%${brand}%`])
    ]);

    return {
      brand,
      products,
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
  });
};
