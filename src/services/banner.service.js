import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { uploadBannerImage, deleteProductImage } from './upload.service.js';
import { bannerSchema, updateBannerSchema } from '../validators/banner.validators.js';

export const listBanners = async (category = null) => {
  const conditions = [];
  const values = [];

  if (category) {
    conditions.push('category = $1');
    values.push(category);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT id, banner_image, link, display_order, category
    FROM category_banners
    ${whereClause}
    ORDER BY display_order ASC
  `;

  const data = await sql(query, values);
  return data || [];
};

export const getBannerById = async (id) => {
  const [data] = await sql('SELECT * FROM category_banners WHERE id = $1 LIMIT 1', [id]);
  if (!data) throw new NotFoundError('Banner not found');
  return data;
};

export const createBanner = async (bannerData, file) => {
  const validation = bannerSchema.safeParse(bannerData);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  if (!file) throw new Error('Banner image is required');

  const validData = validation.data;
  const imageUrl = await uploadBannerImage(file, validData.category);

  try {
    const dataWithImage = { ...validData, banner_image: imageUrl.medium || imageUrl.original || imageUrl };
    const keys = Object.keys(dataWithImage);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => dataWithImage[k]);

    const [banner] = await sql(
      `INSERT INTO category_banners (${cols}) VALUES (${vals}) RETURNING *`,
      values
    );

    return banner;
  } catch (error) {
    await deleteProductImage(imageUrl);
    throw new Error(`Failed to create banner: ${error.message}`);
  }
};

export const updateBanner = async (id, updates, file) => {
  const validation = updateBannerSchema.safeParse(updates);
  if (!validation.success) throw new ValidationError(validation.error.errors[0].message);

  const existingBanner = await getBannerById(id);
  let imageUrl = existingBanner.banner_image;

  if (file) {
    await deleteProductImage(existingBanner.banner_image);
    const uploadRes = await uploadBannerImage(file, updates.category || existingBanner.category);
    imageUrl = uploadRes.medium || uploadRes.original || uploadRes;
  }

  try {
    const dataToUpdate = { ...validation.data, banner_image: imageUrl, updated_at: new Date().toISOString() };
    const keys = Object.keys(dataToUpdate);
    const setFragments = keys.map((k, i) => `"${k}" = $${i + 2}`);
    const values = [id, ...keys.map(k => dataToUpdate[k])];

    const [banner] = await sql(
      `UPDATE category_banners SET ${setFragments.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return banner;
  } catch (error) {
    if (file) await deleteProductImage(imageUrl);
    throw new Error(`Failed to update banner: ${error.message}`);
  }
};

export const deleteBanner = async (id) => {
  const banner = await getBannerById(id);
  if (banner.banner_image) await deleteProductImage(banner.banner_image);
  await sql('DELETE FROM category_banners WHERE id = $1', [id]);
  return true;
};
