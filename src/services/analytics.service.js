import { sql } from '../config/neon.js';

export const getOverviewAnalytics = async () => {

  const [
    [{ count: usersCount }],
    [{ count: productsCount }],
    [{ total_clicks }]
  ] = await Promise.all([
    sql('SELECT COUNT(*)::int FROM "user"'),
    sql('SELECT COUNT(*)::int FROM products'),
    sql('SELECT SUM(clicks)::int as total_clicks FROM products')
  ]);

  return {
    total_users: usersCount || 0,
    total_products: productsCount || 0,
    total_clicks: total_clicks || 0
  };
};

export const getTrendingAnalytics = async () => {
  const products = await sql(
    `SELECT id, name, brand, category, clicks, popularity, created_at
         FROM products
         ORDER BY clicks DESC
         LIMIT 20`
  );

  if (!products) return [];

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

export const getClickAnalytics = async ({ product_id }) => {
  const conditions = [];
  const values = [];

  if (product_id) {
    conditions.push('id = $1');
    values.push(product_id);
  }

  let query = 'SELECT id, name, brand, category, clicks, created_at, updated_at FROM products';
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  query += ' ORDER BY clicks DESC';

  const products = await sql(query, values);

  if (!products) throw new Error('Failed to fetch click analytics');

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
