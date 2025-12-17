import sharp from 'sharp';
import { uploadToR2, deleteFromR2, R2_PUBLIC_URL } from '../config/r2.js';
import logger from '../utils/logger.js';

const IMAGE_VARIANTS = [
  { name: 'thumb', width: 100, quality: 70 },
  { name: 'medium', width: 400, quality: 80 },
  { name: 'large', width: 800, quality: 85 }
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const validateImageFile = (file) => {
  if (!file?.buffer) throw new Error('No file provided');
  if (file.size > MAX_IMAGE_SIZE) throw new Error('File too large. Maximum 10MB');
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) throw new Error('Invalid image type');
};

const validateVideoFile = (file) => {
  if (!file?.buffer) throw new Error('No file provided');
  if (file.size > MAX_VIDEO_SIZE) throw new Error('File too large. Maximum 100MB');
  if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) throw new Error('Invalid video type');
};

const processAndUploadImage = async (fileBuffer, folder, baseKey) => {
  const metadata = await sharp(fileBuffer).metadata();
  if (metadata.width > 4000 || metadata.height > 4000) {
    throw new Error('Image too large. Maximum 4000x4000 pixels');
  }

  const urls = {};
  for (const variant of IMAGE_VARIANTS) {
    const processed = await sharp(fileBuffer)
      .resize(variant.width, null, { withoutEnlargement: true })
      .webp({ quality: variant.quality })
      .toBuffer();

    const key = `${folder}/${baseKey}_${variant.name}.webp`;
    urls[variant.name] = await uploadToR2(key, processed, 'image/webp');
  }

  return urls;
};

const extractBaseKey = (url) => {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.split('?')[0];
  let key;

  if (R2_PUBLIC_URL && cleanUrl.includes(R2_PUBLIC_URL)) {
    key = cleanUrl.replace(`${R2_PUBLIC_URL}/`, '');
  } else if (cleanUrl.startsWith('http')) {
    try {
      key = new URL(cleanUrl).pathname.replace(/^\//, '');
    } catch {
      return null;
    }
  } else {
    key = cleanUrl;
  }

  return key.replace(/_(thumb|medium|large)\.webp$/, '');
};

export const uploadProductImage = async (file, productId, index = 0) => {
  validateImageFile(file);
  const baseKey = `${productId}/${Date.now()}_${index}`;
  return processAndUploadImage(file.buffer, 'products', baseKey);
};

export const uploadMultipleProductImages = async (files, productId) => {
  if (!files?.length) throw new Error('No files provided');
  if (files.length > 10) throw new Error('Maximum 10 images per upload');

  return Promise.all(files.map((file, i) => uploadProductImage(file, productId, i)));
};

export const deleteProductImage = async (imageData) => {
  if (!imageData) return true;

  try {
    if (typeof imageData === 'object' && !Array.isArray(imageData)) {
      const urls = Object.entries(imageData)
        .filter(([key, val]) => key !== 'original' && typeof val === 'string')
        .map(([, url]) => deleteFromR2(url));
      await Promise.allSettled(urls);
      return true;
    }

    if (typeof imageData === 'string') {
      const baseKey = extractBaseKey(imageData);
      if (!baseKey) return false;

      const variants = ['thumb', 'medium', 'large'];
      await Promise.allSettled(
        variants.map(v => deleteFromR2(`${R2_PUBLIC_URL}/${baseKey}_${v}.webp`))
      );
      return true;
    }

    return true;
  } catch (error) {
    logger.error(`Delete image failed: ${error.message}`);
    return false;
  }
};

export const deleteMultipleProductImages = async (images) => {
  if (!Array.isArray(images)) return true;
  await Promise.allSettled(images.map(img => deleteProductImage(img)));
  return true;
};

export const uploadReelVideo = async (file, reelId) => {
  validateVideoFile(file);
  const key = `reels/${reelId}/${Date.now()}_video.mp4`;
  const url = await uploadToR2(key, file.buffer, 'video/mp4');
  return { video_url: url, thumbnail_url: null, size: file.size };
};

export const deleteReelVideo = async (videoUrl) => {
  if (!videoUrl?.includes(R2_PUBLIC_URL)) return true;
  try {
    await deleteFromR2(videoUrl);
    return true;
  } catch {
    return false;
  }
};

export const uploadOfferBanner = async (file, offerId) => {
  validateImageFile(file);
  return processAndUploadImage(file.buffer, 'offers', `${offerId}/${Date.now()}`);
};

export const uploadColorComboImage = async (file, comboId) => {
  validateImageFile(file);
  return processAndUploadImage(file.buffer, 'color-combos', `${comboId}/${Date.now()}`);
};

export const uploadBannerImage = async (file, category) => {
  validateImageFile(file);
  const sanitized = category.replace(/[^a-zA-Z0-9-_]/g, '');
  return processAndUploadImage(file.buffer, 'banners', `${sanitized}/${Date.now()}`);
};

export const deleteOfferBanner = deleteProductImage;
