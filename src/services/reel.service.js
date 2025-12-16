import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { deleteReelVideo } from './upload.service.js';
import { reelSchema } from '../validators/reel.validators.js';

export const listAllReels = async ({ page = 1, limit = 20 } = {}) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [reels, countResult] = await Promise.all([
    sql(
      `SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
           FROM reels
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
      [l, offset]
    ),
    sql('SELECT COUNT(*)::int FROM reels')
  ]);

  const count = countResult[0]?.count || 0;

  return {
    reels: reels || [],
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l)
  };
};

export const listReelsByCategory = async (category, { page = 1, limit = 20 } = {}) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [reels, countResult] = await Promise.all([
    sql(
      `SELECT id, category, video_url, thumbnail_url, product_ids, views, likes, created_at
           FROM reels
           WHERE category = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
      [category, l, offset]
    ),
    sql('SELECT COUNT(*)::int FROM reels WHERE category = $1', [category])
  ]);

  const count = countResult[0]?.count || 0;

  return {
    reels: reels || [],
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l)
  };
};

export const getReelWithProducts = async (id) => {
  const [reel] = await sql('SELECT * FROM reels WHERE id = $1 LIMIT 1', [id]);
  if (!reel) throw new NotFoundError('Reel not found');

  if (reel.product_ids?.length > 0) {
    const products = await sql(
      'SELECT id, name, price, brand, images, category, color, affiliate_link FROM products WHERE id = ANY($1)',
      [reel.product_ids]
    );
    reel.products = products || [];
  } else {
    reel.products = [];
  }
  return reel;
};

export const createReel = async (reelData) => {
  const validation = reelSchema.safeParse(reelData);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const validData = validation.data;
  const keys = Object.keys(validData);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => validData[k]);

  const [reel] = await sql(
    `INSERT INTO reels (${cols}) VALUES (${vals}) RETURNING *`,
    values
  );

  if (!reel) throw new Error('Failed to create reel');
  return reel;
};

export const updateReel = async (id, updates) => {
  const validation = reelSchema.partial().safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const [existingReel] = await sql('SELECT video_url, thumbnail_url FROM reels WHERE id = $1 LIMIT 1', [id]);
  if (!existingReel) throw new NotFoundError('Reel not found');

  if (updates.video_url && existingReel.video_url !== updates.video_url) {
    await deleteReelVideo(existingReel.video_url).catch(e => logger.error(`Failed to delete old video: ${e.message}`));
  }

  if (updates.thumbnail_url && existingReel.thumbnail_url !== updates.thumbnail_url) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(existingReel.thumbnail_url).catch(e => logger.error(`Failed to delete old thumbnail: ${e.message}`));
  }

  const validUpdates = validation.data;
  if (Object.keys(validUpdates).length === 0) return existingReel;

  const keys = Object.keys(validUpdates);
  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
  const values = [id, ...keys.map(k => validUpdates[k])];

  const [updated] = await sql(
    `UPDATE reels SET ${setFragments.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  if (!updated) throw new Error('Failed to update reel');
  return updated;
};

export const deleteReel = async (id) => {
  const [reel] = await sql('SELECT video_url, thumbnail_url FROM reels WHERE id = $1 LIMIT 1', [id]);
  if (!reel) throw new NotFoundError('Reel not found');

  if (reel.video_url) await deleteReelVideo(reel.video_url);

  if (reel.thumbnail_url) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(reel.thumbnail_url);
  }

  await sql('DELETE FROM reels WHERE id = $1', [id]);
  return true;
};

export const incrementReelViews = async (id) => {
  await sql('UPDATE reels SET views = COALESCE(views, 0) + 1 WHERE id = $1', [id]);
  return true;
};

export const incrementReelLikes = async (id) => {
  await sql('UPDATE reels SET likes = COALESCE(likes, 0) + 1 WHERE id = $1', [id]);
  return true;
};

export const decrementReelLikes = async (id) => {
  await sql('UPDATE reels SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = $1', [id]);
  return true;
};

export const trackUserLike = async (reelId, userId) => {
  try {
    await sql(
      'INSERT INTO reel_likes (reel_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [reelId, userId]
    );
  } catch (e) {
    // ignore unique violation
  }
  return true;
};

export const untrackUserLike = async (reelId, userId) => {
  await sql('DELETE FROM reel_likes WHERE reel_id = $1 AND user_id = $2', [reelId, userId]);
  return true;
};

export const getLikedReelsByUser = async (userId) => {
  const reels = await sql(
    `SELECT r.* FROM reels r JOIN reel_likes l ON r.id = l.reel_id WHERE l.user_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  );
  return reels || [];
};
