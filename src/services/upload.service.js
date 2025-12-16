import sharp from 'sharp';
import { uploadToR2, deleteFromR2, R2_PUBLIC_URL } from '../config/r2.js';
import logger from '../utils/logger.js';

const IMAGE_VARIANTS = [
  { name: 'thumb', width: 100, quality: 70 },
  { name: 'medium', width: 400, quality: 80 },
  { name: 'large', width: 800, quality: 85 }
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const validateImageFile = (file) => {
  if (!file || !file.buffer) {
    throw new Error('No file provided');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }
};

const validateVideoFile = (file) => {
  if (!file || !file.buffer) {
    throw new Error('No file provided');
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
  }
  if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
  }
};

const processAndUploadImage = async (fileBuffer, folder, baseKey) => {
  const urls = {};
  const metadata = await sharp(fileBuffer).metadata();

  if (metadata.width > 4000 || metadata.height > 4000) {
    throw new Error('Image dimensions too large. Maximum 4000x4000 pixels');
  }

  for (const variant of IMAGE_VARIANTS) {
    const processed = await sharp(fileBuffer)
      .resize(variant.width, null, { withoutEnlargement: true })
      .webp({ quality: variant.quality })
      .toBuffer();

    const key = `${folder}/${baseKey}_${variant.name}.webp`;
    urls[variant.name] = await uploadToR2(key, processed, 'image/webp');
  }

  urls.original = {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format
  };

  return urls;
};

export const uploadProductImage = async (file, productId, index = 0) => {
  try {
    validateImageFile(file);
    const baseKey = `${productId}/${Date.now()}_${index}`;
    return await processAndUploadImage(file.buffer, 'products', baseKey);
  } catch (error) {
    logger.error(`Product image upload failed: ${error.message}`);
    throw new Error(`Failed to upload product image: ${error.message}`);
  }
};

export const uploadMultipleProductImages = async (files, productId) => {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }
  if (files.length > 10) {
    throw new Error('Maximum 10 images per upload');
  }

  try {
    const uploadPromises = files.map((file, index) =>
      uploadProductImage(file, productId, index)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error(`Multiple image upload failed: ${error.message}`);
    throw new Error(`Failed to upload product images: ${error.message}`);
  }
};

export const deleteProductImage = async (imageData) => {
  try {
    if (!imageData) return true;

    if (typeof imageData === 'object') {
      const deletePromises = Object.entries(imageData)
        .filter(([key, value]) => key !== 'original' && typeof value === 'string')
        .map(([_, url]) => deleteFromR2(url));
      await Promise.all(deletePromises);
    } else if (typeof imageData === 'string' && imageData.includes(R2_PUBLIC_URL)) {
      await deleteFromR2(imageData);
    }
    return true;
  } catch (error) {
    logger.error(`Failed to delete image: ${error.message}`);
    return false;
  }
};

export const deleteMultipleProductImages = async (imagesArray) => {
  if (!imagesArray || !Array.isArray(imagesArray)) return true;

  const deletePromises = imagesArray.map(img => deleteProductImage(img));
  await Promise.allSettled(deletePromises);
  return true;
};

export const uploadReelVideo = async (file, reelId) => {
  try {
    validateVideoFile(file);

    const videoKey = `reels/${reelId}/${Date.now()}_video.mp4`;
    const videoUrl = await uploadToR2(videoKey, file.buffer, 'video/mp4');

    return {
      video_url: videoUrl,
      thumbnail_url: null,
      size: file.size
    };
  } catch (error) {
    logger.error(`Reel video upload failed: ${error.message}`);
    throw new Error(`Failed to upload reel video: ${error.message}`);
  }
};

export const deleteReelVideo = async (videoUrl) => {
  try {
    if (!videoUrl || !videoUrl.includes(R2_PUBLIC_URL)) return true;
    await deleteFromR2(videoUrl);
    return true;
  } catch (error) {
    logger.error(`Failed to delete reel video: ${error.message}`);
    return false;
  }
};

export const uploadOfferBanner = async (file, offerId) => {
  try {
    validateImageFile(file);
    const baseKey = `${offerId}/${Date.now()}`;
    return await processAndUploadImage(file.buffer, 'offers', baseKey);
  } catch (error) {
    logger.error(`Offer banner upload failed: ${error.message}`);
    throw new Error(`Failed to upload offer banner: ${error.message}`);
  }
};

export const uploadColorComboImage = async (file, comboId) => {
  try {
    validateImageFile(file);
    const baseKey = `${comboId}/${Date.now()}`;
    return await processAndUploadImage(file.buffer, 'color-combos', baseKey);
  } catch (error) {
    logger.error(`Color combo image upload failed: ${error.message}`);
    throw new Error(`Failed to upload color combo image: ${error.message}`);
  }
};

export const deleteOfferBanner = deleteProductImage;

export const uploadBannerImage = async (file, category) => {
  try {
    validateImageFile(file);
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const baseKey = `${sanitizedCategory}/${Date.now()}`;
    return await processAndUploadImage(file.buffer, 'banners', baseKey);
  } catch (error) {
    logger.error(`Banner upload failed: ${error.message}`);
    throw new Error(`Failed to upload banner: ${error.message}`);
  }
};
