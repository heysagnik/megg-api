import sharp from 'sharp';
import { uploadToR2, deleteFromR2, R2_PUBLIC_URL } from '../config/r2.js';
import logger from '../utils/logger.js';

const CF_WORKER_URL = process.env.CF_WORKER_URL || '';

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

const buildOptimizeUrl = (originalUrl, width, quality) => {
  if (!CF_WORKER_URL) return originalUrl;
  return `${CF_WORKER_URL}/api/optimize?url=${encodeURIComponent(originalUrl)}&w=${width}&q=${quality}&f=webp`;
};

const processAndUploadImage = async (fileBuffer, folder, baseKey) => {
  const metadata = await sharp(fileBuffer).metadata();
  if (metadata.width > 4000 || metadata.height > 4000) {
    throw new Error('Image too large. Maximum 4000x4000 pixels');
  }

  const optimized = await sharp(fileBuffer)
    .resize(2000, null, { withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const key = `${folder}/${baseKey}.webp`;
  const originalUrl = await uploadToR2(key, optimized, 'image/webp');

  return {
    original: originalUrl,
    thumb: buildOptimizeUrl(originalUrl, 100, 70),
    medium: buildOptimizeUrl(originalUrl, 400, 80),
    large: buildOptimizeUrl(originalUrl, 800, 85)
  };
};

const extractOriginalUrl = (imageData) => {
  if (!imageData) return null;
  if (typeof imageData === 'object' && imageData.original) return imageData.original;
  if (typeof imageData === 'string') {
    const cleanUrl = imageData.split('?')[0];
    if (cleanUrl.includes(R2_PUBLIC_URL)) return cleanUrl;
    return cleanUrl.replace(/_(thumb|medium|large)\.webp$/, '.webp');
  }
  return null;
};

export const uploadProductImage = async (file, productId, index = 0) => {
  if (!productId) throw new Error('Product ID is required for image upload');
  validateImageFile(file);
  const baseKey = `${productId}/${Date.now()}_${index}`;
  return processAndUploadImage(file.buffer, 'products', baseKey);
};

export const uploadMultipleProductImages = async (files, productId) => {
  if (!productId) throw new Error('Product ID is required for image upload');
  if (!files?.length) throw new Error('No files provided');
  if (files.length > 10) throw new Error('Maximum 10 images per upload');

  return Promise.all(files.map((file, i) => uploadProductImage(file, productId, i)));
};

export const deleteProductImage = async (imageData) => {
  if (!imageData) return true;

  try {
    if (typeof imageData === 'object' && imageData.original) {
      await deleteFromR2(imageData.original);
      return true;
    }

    if (typeof imageData === 'string') {
      const originalUrl = extractOriginalUrl(imageData);
      if (originalUrl) {
        await deleteFromR2(originalUrl);
      }
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

  const timestamp = Date.now();
  const baseKey = `reels/${reelId}/${timestamp}`;

  try {
    const { processVideo } = await import('../utils/videoProcessor.js');
    const { videoBuffer, thumbnailBuffer } = await processVideo(file.buffer);

    const videoKey = `${baseKey}_video.mp4`;
    const videoUrl = await uploadToR2(videoKey, videoBuffer, 'video/mp4');

    const thumbKey = `${baseKey}_thumb.jpg`;
    const thumbnailUrl = await uploadToR2(thumbKey, thumbnailBuffer, 'image/jpeg');

    return {
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      size: videoBuffer.length,
      compressed: true
    };
  } catch (error) {
    logger.warn('Video processing failed, uploading original:', error.message);

    const videoKey = `${baseKey}_video.mp4`;
    const videoUrl = await uploadToR2(videoKey, file.buffer, 'video/mp4');

    return {
      video_url: videoUrl,
      thumbnail_url: null,
      size: file.size,
      compressed: false
    };
  }
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
