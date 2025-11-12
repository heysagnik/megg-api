import { supabaseAdmin } from '../config/supabase.js';

export const trackProductClick = async (productId, userId = null) => {
  await supabaseAdmin
    .from('trending_clicks')
    .insert({
      product_id: productId,
      user_id: userId
    });

  return true;
};

export const getTrendingProducts = async (limit = 10) => {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, category, subcategory, color, affiliate_link, clicks, popularity, updated_at')
    .order('clicks', { ascending: false })
    .limit(limit);

  if (error || !products) {
    return [];
  }

  return products.map(product => ({
    ...product,
    click_count: product.clicks || 0,
    last_clicked: product.updated_at
  }));
};

