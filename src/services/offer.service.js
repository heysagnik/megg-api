import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import { uploadOfferBanner, deleteOfferBanner } from './upload.service.js';
import { offerSchema } from '../validators/offer.validators.js';

export const listOffers = async ({ page, limit }) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [offers, countResult] = await Promise.all([
    sql('SELECT id, title, banner_image, affiliate_link FROM offers ORDER BY created_at DESC LIMIT $1 OFFSET $2', [l, offset]),
    sql('SELECT COUNT(*)::int FROM offers')
  ]);

  const count = countResult[0]?.count || 0;

  return {
    offers: (offers || []).map(o => ({
      id: o.id,
      name: o.title,
      banner_image: o.banner_image,
      affiliate_link: o.affiliate_link || null
    })),
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l)
  };
};

export const getOfferById = async (id) => {
  const [data] = await sql('SELECT id, title, banner_image, affiliate_link FROM offers WHERE id = $1 LIMIT 1', [id]);
  if (!data) throw new NotFoundError('Offer not found');

  return {
    id: data.id,
    name: data.title,
    banner_image: data.banner_image,
    affiliate_link: data.affiliate_link || null
  };
};

export const createOffer = async (offerData) => {
  const validation = offerSchema.safeParse(offerData);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const validData = validation.data;
  const keys = Object.keys(validData);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => validData[k]);

  const [offer] = await sql(
    `INSERT INTO offers (${cols}) VALUES (${vals}) RETURNING *`,
    values
  );

  if (!offer) throw new Error('Failed to create offer');
  return offer;
};

export const updateOffer = async (id, updates) => {
  const validation = offerSchema.partial().safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const [existingOffer] = await sql('SELECT banner_image FROM offers WHERE id = $1 LIMIT 1', [id]);
  if (!existingOffer) throw new NotFoundError('Offer not found');

  if (updates.banner_image && existingOffer.banner_image !== updates.banner_image) {
    await deleteOfferBanner(existingOffer.banner_image).catch(err => logger.error(`Failed to delete old banner: ${err.message}`));
  }

  const validUpdates = { ...validation.data, updated_at: new Date().toISOString() };
  const keys = Object.keys(validUpdates);
  const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
  const values = [id, ...keys.map(k => validUpdates[k])];

  const [updated] = await sql(
    `UPDATE offers SET ${setFragments.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  if (!updated) throw new Error('Failed to update offer');
  return updated;
};

export const deleteOffer = async (id) => {
  const [offer] = await sql('SELECT banner_image FROM offers WHERE id = $1 LIMIT 1', [id]);
  if (offer?.banner_image) await deleteOfferBanner(offer.banner_image);
  await sql('DELETE FROM offers WHERE id = $1', [id]);
  return true;
};
