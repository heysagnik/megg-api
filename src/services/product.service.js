import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import { PAGINATION } from '../config/constants.js';
import logger from '../utils/logger.js';

const applySorting = (query, sort) => {
  switch (sort) {
    case 'popularity':
      return query.order('popularity', { ascending: false });
    case 'price_asc':
      return query.order('price', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false });
    case 'oldest':
      return query.order('created_at', { ascending: true });
    case 'newest':
    default:
      return query.order('created_at', { ascending: false });
  }
};
export const listProducts = async ({ category, subcategory, color, search, sort, page, limit }) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  const offset = (p - 1) * l;

  let query = supabaseAdmin
    .from('products')
    .select('id, name, description, price, brand, images, category, subcategory, color, affiliate_link, popularity, clicks, created_at', { count: 'exact' });

  if (category) query = query.eq('category', category);
  if (subcategory) query = query.eq('subcategory', subcategory);
  if (color) query = query.eq('color', color);
  if (search) {
    query = query.textSearch('search_vector', search, {
      config: 'english',
      type: 'plain'
    });
  }

  query = applySorting(query, sort);
  query = query.range(offset, offset + l - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return {
    products: data,
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l)
  };
};

export const browseByCategory = async ({ category, subcategory, color, sort = 'popularity', page, limit }) => {
  const p = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const l = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT));
  const offset = (p - 1) * l;

  let query = supabaseAdmin
    .from('products')
    .select('id, name, description, price, brand, images, category, subcategory, color, affiliate_link, popularity, clicks, created_at', { count: 'exact' })
    .eq('category', category);

  if (subcategory) query = query.eq('subcategory', subcategory);
  if (color) query = query.eq('color', color);

  query = applySorting(query, sort);
  query = query.range(offset, offset + l - 1);

  const productsPromise = query.then(({ data, error, count }) => {
    if (error) throw new Error(`Failed to fetch products: ${error.message}`);
    return { data, count };
  });

  const bannersPromise = supabaseAdmin
    .from('category_banners')
    .select('id, banner_image, link, display_order')
    .eq('category', category)
    .order('display_order', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw new Error(`Failed to fetch category banners: ${error.message}`);
      return data;
    });

  const [{ data: products, count }, banners] = await Promise.all([productsPromise, bannersPromise]);

  return {
    category,
    banners: banners || [],
    products: products || [],
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l),
    appliedFilters: {
      subcategory,
      color,
      sort
    }
  };
};

export const getProductById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Product not found');
  }


  supabaseAdmin
    .from('products')
    .update({ popularity: (data.popularity || 0) + 1 })
    .eq('id', id)
    .then(() => { })
    .catch(err => logger.error(`Failed to update popularity for product ${id}: ${err.message}`));

  const recommended = await getRecommendedProducts(data.suggested_colors, id);

  return { product: data, recommended };
};

export const incrementProductClicks = async (id) => {
  // Use the existing RPC for clicks
  await supabaseAdmin.rpc('increment_product_clicks', { product_id: id });
};

export const getRecommendedProducts = async (suggestedColors, excludeId) => {
  if (!suggestedColors || suggestedColors.length === 0) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, color, category, subcategory')
    .neq('id', excludeId)
    .in('color', suggestedColors)
    .limit(6);

  if (error) {
    return [];
  }

  return data;
};

export const getRelatedProducts = async (id) => {
  // Optimize: Fetch only category instead of full product details
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('category')
    .eq('id', id)
    .single();

  if (productError || !product) {
    throw new NotFoundError('Product not found');
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, color, category, subcategory')
    .eq('category', product.category)
    .neq('id', id)
    .order('popularity', { ascending: false })
    .limit(8);

  if (error) {
    return [];
  }

  return data;
};

export const createProduct = async (productData) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    logger.error('Product creation error:', error);

    if (error.code === '23514') {
      throw new Error(`Invalid category or subcategory value. Please check that '${productData.category}' and '${productData.subcategory}' are valid enum values.`);
    }
    if (error.code === '22P02') {
      throw new Error(`Invalid enum value provided: ${error.message}`);
    }
    if (error.code === '23505') {
      throw new Error('A product with this identifier already exists.');
    }

    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
};

export const updateProduct = async (id, updates, newFiles = []) => {
  const { data: existingProduct, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existingProduct) {
    throw new NotFoundError('Product not found');
  }

  if (updates.images !== undefined || newFiles.length > 0) {
    const currentImages = existingProduct.images || [];
    let keptImages = updates.images || [];

    if (!Array.isArray(keptImages)) keptImages = [keptImages];
    keptImages = keptImages.filter(url => typeof url === 'string' && url.trim().length > 0);

    const imagesToDelete = currentImages.filter(img => !keptImages.includes(img));

    if (imagesToDelete.length > 0) {
      const { deleteMultipleProductImages } = await import('./upload.service.js');
      await deleteMultipleProductImages(imagesToDelete);
    }

    let newImageUrls = [];
    if (newFiles.length > 0) {
      const { uploadMultipleProductImages } = await import('./upload.service.js');
      newImageUrls = await uploadMultipleProductImages(newFiles);
    }

    updates.images = [...keptImages, ...newImageUrls];
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Product update error:', error);

    if (error.code === '23514' || error.code === '22P02') {
      throw new Error(`Invalid enum value: ${error.message}`);
    }

    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data;
};

export const deleteProduct = async (id) => {
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !product) {
    throw new NotFoundError('Product not found');
  }

  const { data: colorCombos } = await supabaseAdmin
    .from('color_combos')
    .select('id, product_ids')
    .contains('product_ids', [id]);

  if (colorCombos && colorCombos.length > 0) {
    for (const combo of colorCombos) {
      const updatedProductIds = combo.product_ids.filter(pid => pid !== id);
      await supabaseAdmin
        .from('color_combos')
        .update({ product_ids: updatedProductIds })
        .eq('id', combo.id);
    }
  }

  const { data: reels } = await supabaseAdmin
    .from('reels')
    .select('id, product_ids')
    .contains('product_ids', [id]);

  if (reels && reels.length > 0) {
    for (const reel of reels) {
      if (reel.product_ids && reel.product_ids.length > 0) {
        const updatedProductIds = reel.product_ids.filter(pid => pid !== id);
        await supabaseAdmin
          .from('reels')
          .update({ product_ids: updatedProductIds })
          .eq('id', reel.id);
      }
    }
  }

  if (product.images && product.images.length > 0) {
    const { deleteMultipleProductImages } = await import('./upload.service.js');
    await deleteMultipleProductImages(product.images);
  }

  const { data: deletedRow, error: deleteError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (deleteError) {
    throw new Error(`Failed to delete product: ${deleteError.message}`);
  }

  if (!deletedRow) {
    throw new Error('Failed to delete product: no rows deleted');
  }

  return true;
};


export const getColorVariants = async (id) => {
  // 1. Fetch the source product to get its metadata
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('name, brand, subcategory, category')
    .eq('id', id)
    .single();

  if (productError || !product) {
    throw new NotFoundError('Product not found');
  }

  // 2. Find other products with same Brand, Subcategory, and Name
  // We use ilike for name to be case-insensitive
  let query = supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, color, category, subcategory')
    .eq('brand', product.brand)
    .ilike('name', product.name) // Heuristic: Same name = variant
    .neq('id', id); // Exclude current product

  // Optional: strict subcategory match if it exists
  if (product.subcategory) {
    query = query.eq('subcategory', product.subcategory);
  } else {
    query = query.eq('category', product.category);
  }

  const { data, error } = await query.limit(10); // Limit to avoid massive lists

  if (error) {
    return [];
  }

  return data;
};

export const getRecommendedFromSubcategory = async (id) => {
  // 1. Fetch the source product to get its subcategory
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('subcategory, category')
    .eq('id', id)
    .single();

  if (productError || !product) {
    throw new NotFoundError('Product not found');
  }

  // 2. Find other products from the same subcategory
  let query = supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, color, category, subcategory, affiliate_link, popularity')
    .neq('id', id)
    .order('popularity', { ascending: false })
    .limit(12);

  // If subcategory exists, filter by it; otherwise use category
  if (product.subcategory) {
    query = query.eq('subcategory', product.subcategory);
  } else {
    query = query.eq('category', product.category);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data;
};
