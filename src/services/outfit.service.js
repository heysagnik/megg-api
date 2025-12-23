import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { outfitSchema } from '../validators/outfit.validators.js';

export const listOutfits = async ({ page = 1, limit = 20 } = {}) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [outfits, countResult] = await Promise.all([
    sql(
      `SELECT id, title, banner_image, product_ids, created_at
           FROM outfits
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
      [l, offset]
    ),
    sql('SELECT COUNT(*)::int FROM outfits')
  ]);

  const count = countResult[0]?.count || 0;

  return {
    outfits: outfits || [],
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l)
  };
};

export const getOutfitById = async (id) => {
  const [data] = await sql('SELECT * FROM outfits WHERE id = $1 LIMIT 1', [id]);
  if (!data) throw new NotFoundError('Outfit not found');
  return data;
};

export const createOutfit = async (outfitData) => {
  const validation = outfitSchema.safeParse(outfitData);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const validData = validation.data;
  const keys = Object.keys(validData);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => validData[k]);

  const [outfit] = await sql(
    `INSERT INTO outfits (${cols}) VALUES (${vals}) RETURNING *`,
    values
  );

  if (!outfit) throw new Error('Failed to create outfit');
  return outfit;
};

export const updateOutfit = async (id, updates) => {
  const validation = outfitSchema.partial().safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const [existingOutfit] = await sql('SELECT banner_image FROM outfits WHERE id = $1 LIMIT 1', [id]);
  if (!existingOutfit) throw new NotFoundError('Outfit not found');

  if (updates.banner_image && existingOutfit.banner_image !== updates.banner_image) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(existingOutfit.banner_image).catch(e => logger.error(`Failed to delete old banner: ${e.message}`));
  }

  const validUpdates = { ...validation.data };
  const keys = Object.keys(validUpdates);
  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
  const values = [id, ...keys.map(k => validUpdates[k])];

  const [outfit] = await sql(
    `UPDATE outfits SET ${setFragments.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  if (!outfit) throw new Error('Failed to update outfit');
  return outfit;
};

export const deleteOutfit = async (id) => {
  const [outfit] = await sql('SELECT banner_image FROM outfits WHERE id = $1 LIMIT 1', [id]);
  if (outfit?.banner_image) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(outfit.banner_image);
  }
  await sql('DELETE FROM outfits WHERE id = $1', [id]);
  return true;
};
