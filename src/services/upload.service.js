import cloudinary from '../config/cloudinary.js';
import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Helper to upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @param {string} fileName 
 * @param {string} resourceType 
 * @returns {Promise<string>} Secure URL of the uploaded asset
 */
const uploadToCloudinary = (fileBuffer, folder, fileName, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
        public_id: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        format: resourceType === 'image' ? 'webp' : undefined, // Convert images to webp
        quality: 'auto'
      },
      (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Helper to extract public ID from Cloudinary URL
 * @param {string} url 
 * @returns {string|null}
 */
const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/');
    const filenameWithExt = parts.pop();
    const publicId = filenameWithExt.split('.')[0];
    // Join the folder path if it exists (everything after 'upload/v<version>/')
    // This is a simplified extraction, might need adjustment based on exact URL structure
    // Standard Cloudinary URL: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<public_id>.<ext>

    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // parts after 'upload' might include version 'v12345' which we skip for public_id construction if we use folder
    // But cloudinary public_id usually includes the folder.
    // Let's try to reconstruct from the folder known in this app.

    // Better approach: Regex
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const uploadProductImage = async (fileBuffer, fileName, mimeType) => {
  try {
    return await uploadToCloudinary(fileBuffer, 'megg-products', fileName);
  } catch (error) {
    throw new Error(`Failed to upload product image: ${error.message}`);
  }
};

export const uploadMultipleProductImages = async (files) => {
  try {
    const uploadPromises = files.map(file =>
      uploadProductImage(file.buffer, file.originalname, file.mimetype)
    );

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    throw new Error(`Failed to upload product images: ${error.message}`);
  }
};

export const deleteProductImage = async (imageUrl) => {
  try {
    // Check if it's a Supabase URL
    if (imageUrl.includes('supabase.co')) {
      let filePath = null;
      try {
        const parsed = new URL(imageUrl);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        const idx = pathSegments.findIndex((seg) => seg === 'product-images');
        if (idx !== -1) {
          filePath = pathSegments.slice(idx + 1).join('/');
        }
      } catch (e) {
        const match = imageUrl.match(/product-images\/(.+?)(\?|$)/);
        if (match && match[1]) {
          filePath = match[1];
        }
      }

      if (filePath) {
        const { error } = await supabaseAdmin.storage
          .from('product-images')
          .remove([filePath]);
        if (error) return false;
        return true;
      }
    }
    // Check if it's a Cloudinary URL
    else if (imageUrl.includes('cloudinary.com')) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        logger.info(`Attempting to delete Cloudinary image: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);
        logger.info(`Cloudinary deletion result for ${publicId}:`, result);

        if (result.result === 'ok' || result.result === 'not found') {
          return true;
        } else {
          logger.error(`Failed to delete Cloudinary image ${publicId}: ${result.result}`);
          return false;
        }
      }
    }

    return 'skipped';
  } catch (error) {
    return false;
  }
};

export const deleteMultipleProductImages = async (imageUrls) => {
  const deletePromises = imageUrls.map(url => deleteProductImage(url));
  const results = await Promise.all(deletePromises);

  const failedCount = results.filter(r => r === false).length;

  if (failedCount > 0) {
    throw new Error(`Failed to delete ${failedCount} product image(s)`);
  }

  return true;
};

export const uploadReelVideo = async (fileBuffer, fileName) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'megg-reels',
          public_id: `reel-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          quality: 'auto',
          format: 'mp4',
          eager: [
            { format: 'jpg', transformation: [{ width: 500, crop: 'scale' }] }
          ],
          eager_async: false
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }

          const thumbnailUrl = result.eager && result.eager.length > 0
            ? result.eager[0].secure_url
            : `${result.secure_url.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg')}`;

          resolve({
            video_url: result.secure_url,
            thumbnail_url: thumbnailUrl,
            public_id: result.public_id,
            duration: result.duration,
            format: result.format,
            size: result.bytes
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Failed to upload reel video to Cloudinary: ${error.message}`);
  }
};

export const deleteReelVideo = async (videoUrl) => {
  try {
    const urlParts = videoUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const fileName = fileWithExtension.split('.')[0];

    const folderIndex = urlParts.findIndex(part => part === 'megg-reels');
    if (folderIndex === -1) {
      return false;
    }

    const pathSegments = urlParts.slice(folderIndex);
    const publicId = pathSegments.join('/').replace(/\.[^.]+$/, '');

    logger.info(`Attempting to delete Cloudinary reel video: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    logger.info(`Cloudinary deletion result for ${publicId}:`, result);

    if (result.result === 'ok' || result.result === 'not found') {
      return true;
    } else {
      logger.error(`Failed to delete Cloudinary reel video ${publicId}: ${result.result}`);
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const uploadOfferBanner = async (fileBuffer, fileName, mimeType) => {
  try {
    return await uploadToCloudinary(fileBuffer, 'megg-offers', fileName);
  } catch (error) {
    throw new Error(`Failed to upload offer banner: ${error.message}`);
  }
};

export const uploadColorComboImage = async (fileBuffer, fileName, mimeType) => {
  try {
    return await uploadToCloudinary(fileBuffer, 'megg-color-combos', fileName);
  } catch (error) {
    throw new Error(`Failed to upload color combo image: ${error.message}`);
  }
};

export const deleteOfferBanner = async (imageUrl) => {
  try {
    if (imageUrl.includes('supabase.co')) {
      const urlParts = imageUrl.split('/offer-banners/');
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1].split('?')[0];

      const { error } = await supabaseAdmin.storage
        .from('offer-banners')
        .remove([filePath]);

      if (error) return false;
      return true;
    } else if (imageUrl.includes('cloudinary.com')) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        logger.info(`Attempting to delete Cloudinary offer banner: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);
        logger.info(`Cloudinary deletion result for ${publicId}:`, result);

        if (result.result === 'ok' || result.result === 'not found') {
          return true;
        } else {
          logger.error(`Failed to delete Cloudinary offer banner ${publicId}: ${result.result}`);
          return false;
        }
      }
    }
    return false;
  } catch (err) {
    return false;
  }
};

