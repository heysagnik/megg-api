import { sql } from '../config/neon.js';

export const trackProductClick = async (productId, userId = null) => {
  await sql(
    'INSERT INTO trending_clicks (product_id, user_id) VALUES ($1, $2)',
    [productId, userId]
  );
  return true;
};

export const getTrendingProducts = async (limit = 10) => {
  const products = await sql(
    `SELECT id, name, price, brand, images, category, subcategory, color, affiliate_link, clicks, popularity, updated_at
     FROM products
     ORDER BY clicks DESC
     LIMIT $1`,
    [limit]
  );

  if (!products) return [];

  return products.map(product => ({
    ...product,
    click_count: product.clicks || 0,
    last_clicked: product.updated_at
  }));
};
