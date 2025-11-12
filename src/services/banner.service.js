import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

const uploadBannerImage = async (file, category) => {
  const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
  const filePath = `${category}/${fileName}`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('offer-banners')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('offer-banners')
    .getPublicUrl(filePath);
  
  return publicUrl;
};

const deleteImageFromStorage = async (imageUrl, category) => {
  try {
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${category}/${fileName}`;
    
    await supabaseAdmin.storage
      .from('offer-banners')
      .remove([filePath]);
  } catch (err) {
    throw new Error(`Failed to delete image: ${err.message}`);
  }
};

export const listBanners = async (category = null) => {
  let query = supabaseAdmin
    .from('category_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch banners: ${error.message}`);
  }

  return data || [];
};

export const getBannerById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('category_banners')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Banner not found');
  }

  return data;
};

export const createBanner = async (bannerData, file) => {
  if (!file) {
    throw new Error('Banner image is required');
  }

  const imageUrl = await uploadBannerImage(file, bannerData.category);

  const { data, error } = await supabaseAdmin
    .from('category_banners')
    .insert({
      ...bannerData,
      banner_image: imageUrl
    })
    .select()
    .single();

  if (error) {
    await deleteImageFromStorage(imageUrl, bannerData.category);
    throw new Error(`Failed to create banner: ${error.message}`);
  }

  return data;
};

export const updateBanner = async (id, updates, file) => {
  const existingBanner = await getBannerById(id);
  
  let imageUrl = existingBanner.banner_image;
  
  if (file) {
    await deleteImageFromStorage(existingBanner.banner_image, existingBanner.category);
    imageUrl = await uploadBannerImage(file, updates.category || existingBanner.category);
  }

  const { data, error } = await supabaseAdmin
    .from('category_banners')
    .update({
      ...updates,
      banner_image: imageUrl
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (file) {
      await deleteImageFromStorage(imageUrl, updates.category || existingBanner.category);
    }
    throw new Error(`Failed to update banner: ${error.message}`);
  }

  return data;
};

export const deleteBanner = async (id) => {
  const banner = await getBannerById(id);

  await deleteImageFromStorage(banner.banner_image, banner.category);

  const { error } = await supabaseAdmin
    .from('category_banners')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete banner: ${error.message}`);
  }

  return true;
};

