import { sql } from '../config/neon.js';

export const getUserWishlist = async (userId) => {
  const items = await sql(
    `SELECT p.id, p.name, p.price, p.brand, p.images, p.category, p.color, p.affiliate_link, w.id as wishlist_id, w.added_at
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = $1 AND p.is_active = true
     ORDER BY w.added_at DESC`,
    [userId]
  );
  return items || [];
};

export const addToWishlist = async (userId, productId) => {
  const result = await sql(
    `INSERT INTO wishlist (user_id, product_id) 
     VALUES ($1, $2) 
     ON CONFLICT (user_id, product_id) DO NOTHING 
     RETURNING *`,
    [userId, productId]
  );

  if (!result || result.length === 0) {
    const [existing] = await sql(
      'SELECT id, added_at FROM wishlist WHERE user_id = $1 AND product_id = $2 LIMIT 1',
      [userId, productId]
    );
    return { message: 'Product already in wishlist', id: existing?.id, added_at: existing?.added_at };
  }

  return result[0];
};

export const removeFromWishlist = async (userId, productId) => {
  await sql('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  return true;
};
