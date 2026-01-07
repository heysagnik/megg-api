import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { getCached, invalidateCacheByPrefix, CACHE_TTL } from '../utils/cache.js';
import { deleteProductImage } from './upload.service.js';
import { colorComboSchema } from '../validators/colorCombo.validators.js';

export const listColorCombos = async ({ groupType = null, colorA = null, colorB = null } = {}) => {
  const cacheKey = `color_combos:${groupType || 'all'}:${colorA || 'all'}:${colorB || 'all'}`;

  return getCached(cacheKey, CACHE_TTL.COLOR_COMBOS, async () => {
    let query = 'SELECT id, name, model_image, product_ids, color_a, color_b, color_c, group_type, created_at FROM color_combos';
    const values = [];
    const conditions = [];

    if (groupType) {
      conditions.push(`group_type = $${values.length + 1}`);
      values.push(groupType);
    }

    if (colorA) {
      conditions.push(`color_a = $${values.length + 1}`);
      values.push(colorA);
    }

    if (colorB) {
      conditions.push(`color_b = $${values.length + 1}`);
      values.push(colorB);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';

    const combos = await sql(query, values);

    // Calculate metadata from the result (or ideally from the whole set, but filters apply)
    // Actually, metadata usually needs to show options available *within* the current filter context
    // or global options. The user request says "the colors used in color a, the color used in color b..."
    // implied from the returned list.

    const meta = {
      colors: {
        a: [...new Set(combos.map(c => c.color_a).filter(Boolean))].sort(),
        b: [...new Set(combos.map(c => c.color_b).filter(Boolean))].sort(),
        c: [...new Set(combos.map(c => c.color_c).filter(Boolean))].sort()
      }
    };

    return { combos: combos || [], meta };
  });
};

export const getColorComboProducts = async (id) => {
  const [combo] = await sql('SELECT * FROM color_combos WHERE id = $1 LIMIT 1', [id]);
  if (!combo) throw new NotFoundError('Color combo not found');

  if (combo.product_ids?.length > 0) {
    const products = await sql(
      'SELECT id, name, price, brand, images, category, color, affiliate_link FROM products WHERE id = ANY($1)',
      [combo.product_ids]
    );
    return { combo, products: products || [] };
  }
  return { combo, products: [] };
};

export const createColorCombo = async (comboData) => {
  const validation = colorComboSchema.safeParse(comboData);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const validData = validation.data;
  const keys = Object.keys(validData);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => validData[k]);

  const [combo] = await sql(
    `INSERT INTO color_combos (${cols}) VALUES (${vals}) RETURNING *`,
    values
  );

  if (!combo) throw new Error('Failed to create color combo');
  await invalidateCacheByPrefix('color_combos:');
  return combo;
};

export const updateColorCombo = async (id, updates) => {
  const validation = colorComboSchema.partial().safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const [existingCombo] = await sql('SELECT model_image FROM color_combos WHERE id = $1 LIMIT 1', [id]);

  if (existingCombo && updates.model_image && existingCombo.model_image !== updates.model_image) {
    await deleteProductImage(existingCombo.model_image).catch(e => logger.error(e.message));
  }

  const validUpdates = { ...validation.data, updated_at: new Date().toISOString() };
  const keys = Object.keys(validUpdates);
  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
  const values = [id, ...keys.map(k => validUpdates[k])];

  const [updated] = await sql(
    `UPDATE color_combos SET ${setFragments.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  if (!updated) throw new Error('Failed to update color combo');
  await invalidateCacheByPrefix('color_combos:');
  return updated;
};

export const deleteColorCombo = async (id) => {
  const [combo] = await sql('SELECT model_image FROM color_combos WHERE id = $1 LIMIT 1', [id]);
  if (combo?.model_image) await deleteProductImage(combo.model_image);
  await sql('DELETE FROM color_combos WHERE id = $1', [id]);
  await invalidateCacheByPrefix('color_combos:');
  return true;
};

export const getRecommendedColorCombos = async (id) => {
  const [combo] = await sql('SELECT group_type FROM color_combos WHERE id = $1 LIMIT 1', [id]);
  if (!combo) throw new NotFoundError('Color combo not found');

  const query = 'SELECT * FROM color_combos WHERE id != $1';
  const values = [id];

  if (combo.group_type) {
    return await sql(query + ' AND group_type = $2 LIMIT 10', [id, combo.group_type]);
  }
  return await sql(query + ' LIMIT 10', values);
};
