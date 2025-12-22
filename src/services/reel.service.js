import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { deleteReelVideo, deleteProductImage } from './upload.service.js';
import { reelSchema } from '../validators/reel.validators.js';

export const listAllReels = async ({ page = 1, limit = 20 } = {}) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [reels, countResult] = await Promise.all([
    sql(`SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
         FROM reels ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [l, offset]),
    sql('SELECT COUNT(*)::int FROM reels')
  ]);

  return {
    reels: reels || [],
    total: countResult[0]?.count || 0,
    page: p,
    limit: l,
    totalPages: Math.ceil((countResult[0]?.count || 0) / l)
  };
};

export const listReelsByCategory = async (category, { page = 1, limit = 20 } = {}) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [reels, countResult] = await Promise.all([
    sql(`SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
         FROM reels WHERE category = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [category, l, offset]),
    sql('SELECT COUNT(*)::int FROM reels WHERE category = $1', [category])
  ]);

  return {
    reels: reels || [],
    total: countResult[0]?.count || 0,
    page: p,
    limit: l,
    totalPages: Math.ceil((countResult[0]?.count || 0) / l)
  };
};

export const getReelWithProducts = async (id) => {
  const [reel] = await sql('SELECT * FROM reels WHERE id = $1 LIMIT 1', [id]);
  if (!reel) throw new NotFoundError('Reel not found');

  reel.products = reel.product_ids?.length > 0
    ? await sql('SELECT id, name, price, brand, images, category, color, affiliate_link FROM products WHERE id = ANY($1)', [reel.product_ids])
    : [];

  return reel;
};

export const createReel = async (reelData) => {
  const validation = reelSchema.safeParse(reelData);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const data = validation.data;

  if (data.product_ids && Array.isArray(data.product_ids)) {
    data.product_ids = data.product_ids.filter(id => id && typeof id === 'string');
  } else {
    data.product_ids = [];
  }

  const [reel] = await sql(
    `INSERT INTO reels (category, video_url, thumbnail_url, product_ids) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.category, data.video_url || null, data.thumbnail_url || null, data.product_ids]
  );

  if (!reel) throw new Error('Failed to create reel');
  return reel;
};

export const updateReel = async (id, updates) => {
  const validation = reelSchema.partial().safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const [existing] = await sql('SELECT video_url, thumbnail_url FROM reels WHERE id = $1 LIMIT 1', [id]);
  if (!existing) throw new NotFoundError('Reel not found');

  if (updates.video_url && existing.video_url !== updates.video_url) {
    await deleteReelVideo(existing.video_url).catch(() => { });
  }

  if (updates.thumbnail_url && existing.thumbnail_url !== updates.thumbnail_url) {
    await deleteProductImage(existing.thumbnail_url).catch(() => { });
  }

  const data = validation.data;
  if (Object.keys(data).length === 0) return existing;

  const keys = Object.keys(data);
  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);

  const [updated] = await sql(
    `UPDATE reels SET ${setFragments.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...keys.map(k => data[k])]
  );

  if (!updated) throw new Error('Failed to update reel');
  return updated;
};

export const deleteReel = async (id) => {
  const [reel] = await sql('SELECT video_url, thumbnail_url FROM reels WHERE id = $1 LIMIT 1', [id]);
  if (!reel) throw new NotFoundError('Reel not found');

  if (reel.video_url) await deleteReelVideo(reel.video_url).catch(() => { });
  if (reel.thumbnail_url) await deleteProductImage(reel.thumbnail_url).catch(() => { });

  await sql('DELETE FROM reels WHERE id = $1', [id]);
  return true;
};

export const incrementReelViews = async (id) => {
  await sql('UPDATE reels SET views = COALESCE(views, 0) + 1 WHERE id = $1', [id]);
};

export const incrementReelLikes = async (id) => {
  await sql('UPDATE reels SET likes = COALESCE(likes, 0) + 1 WHERE id = $1', [id]);
};

export const decrementReelLikes = async (id) => {
  await sql('UPDATE reels SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = $1', [id]);
};

export const trackUserLike = async (reelId, userId) => {
  await sql('INSERT INTO reel_likes (reel_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [reelId, userId]);
};

export const untrackUserLike = async (reelId, userId) => {
  await sql('DELETE FROM reel_likes WHERE reel_id = $1 AND user_id = $2', [reelId, userId]);
};

export const getLikedReelsByUser = async (userId) => {
  return await sql(
    `SELECT r.* FROM reels r JOIN reel_likes l ON r.id = l.reel_id WHERE l.user_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  ) || [];
};
