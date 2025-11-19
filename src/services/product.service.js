import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

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
  const offset = (page - 1) * limit;

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
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return {
    products: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
};

export const browseByCategory = async ({ category, subcategory, color, sort = 'popularity', page, limit }) => {
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('products')
    .select('id, name, description, price, brand, images, category, subcategory, color, affiliate_link, popularity, clicks, created_at', { count: 'exact' })
    .eq('category', category);

  if (subcategory) query = query.eq('subcategory', subcategory);
  if (color) query = query.eq('color', color);

  query = applySorting(query, sort);
  query = query.range(offset, offset + limit - 1);

  const { data: products, error: productsError, count } = await query;

  if (productsError) {
    throw new Error(`Failed to fetch products: ${productsError.message}`);
  }

  const { data: banners, error: bannersError } = await supabaseAdmin
    .from('category_banners')
    .select('id, banner_image, link, display_order')
    .eq('category', category)
    .order('display_order', { ascending: true });

  if (bannersError) {
    throw new Error(`Failed to fetch category banners: ${bannersError.message}`);
  }

  return {
    category,
    banners: banners || [],
    products: products || [],
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
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

  await supabaseAdmin.rpc('increment_product_clicks', { product_id: id }).catch(() => { });

  const recommended = await getRecommendedProducts(data.suggested_colors, id);

  return { product: data, recommended };
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
  const product = await getProductById(id);

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, color, category, subcategory')
    .eq('category', product.product.category)
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
    throw new Error('Failed to create product');
  }

  return data;
};

export const updateProduct = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update product');
  }

  return data;
};

export const deleteProduct = async (id) => {
  const product = await getProductById(id);

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

  if (product.product.images && product.product.images.length > 0) {
    const { deleteMultipleProductImages } = await import('./upload.service.js');
    await deleteMultipleProductImages(product.product.images);
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

