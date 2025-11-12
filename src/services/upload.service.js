import cloudinary from '../config/cloudinary.js';
import { supabaseAdmin } from '../config/supabase.js';

export const uploadProductImage = async (fileBuffer, fileName, mimeType) => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `products/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
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

    if (!filePath) {
      return 'skipped';
    }

    const { error } = await supabaseAdmin.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      return false;
    }

    return true;
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

    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    return true;
  } catch (error) {
    return false;
  }
};

export const uploadOfferBanner = async (fileBuffer, fileName, mimeType) => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `offers/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('offer-banners')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('offer-banners')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Failed to upload offer banner: ${error.message}`);
  }
};

export const uploadColorComboImage = async (fileBuffer, fileName, mimeType) => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `color-combos/${timestamp}-${sanitizedFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Failed to upload color combo image: ${error.message}`);
  }
};

export const deleteOfferBanner = async (imageUrl) => {
  try {
    const urlParts = imageUrl.split('/offer-banners/');
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1].split('?')[0];

    const { error } = await supabaseAdmin.storage
      .from('offer-banners')
      .remove([filePath]);

    if (error) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

