import { supabaseAdmin } from '../config/supabase.js';

export const getOverviewAnalytics = async () => {
  const [usersResult, productsResult, clicksResult] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('products').select('clicks')
  ]);

  const totalClicks = clicksResult.data?.reduce((sum, product) => sum + (product.clicks || 0), 0) || 0;

  return {
    total_users: usersResult.count || 0,
    total_products: productsResult.count || 0,
    total_clicks: totalClicks
  };
};

export const getTrendingAnalytics = async () => {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, brand, category, clicks, popularity, created_at')
    .order('clicks', { ascending: false })
    .limit(20);

  if (error || !products) {
    return [];
  }

  return products.map(product => ({
    product_id: product.id,
    click_count: product.clicks || 0,
    popularity: product.popularity || 0,
    last_clicked: product.created_at,
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category
    }
  }));
};

export const getClickAnalytics = async ({ start_date, end_date, product_id }) => {
  let query = supabaseAdmin
    .from('products')
    .select('id, name, brand, category, clicks, created_at, updated_at');

  if (product_id) {
    query = query.eq('id', product_id);
  }

  const { data: products, error } = await query.order('clicks', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch click analytics');
  }

  const totalClicks = products.reduce((sum, p) => sum + (p.clicks || 0), 0);

  return {
    total_clicks: totalClicks,
    products: products.map(p => ({
      product_id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      clicks: p.clicks || 0,
      last_updated: p.updated_at
    }))
  };
};

