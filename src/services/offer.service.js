import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const listOffers = async ({ page, limit }) => {
  const offset = (page - 1) * limit;
  const now = new Date().toISOString();

  const { data, error, count } = await supabaseAdmin
    .from('offers')
    .select('id, title, banner_image, affiliate_link', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch offers');
  }

  const minimal = (data || []).map(o => ({
    id: o.id,
    name: o.title,
    banner_image: o.banner_image,
    affiliate_link: o.affiliate_link || null
  }));

  return {
    offers: minimal,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
};

export const getOfferById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('id, title, banner_image, affiliate_link')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Offer not found');
  }

  return {
    id: data.id,
    name: data.title,
    banner_image: data.banner_image,
    affiliate_link: data.affiliate_link || null
  };
};

export const createOffer = async (offerData) => {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .insert(offerData)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create offer');
  }

  return data;
};

export const updateOffer = async (id, updates) => {
  // Fetch existing offer to check for image changes
  const { data: existingOffer } = await supabaseAdmin
    .from('offers')
    .select('banner_image')
    .eq('id', id)
    .single();

  if (existingOffer && updates.banner_image && existingOffer.banner_image !== updates.banner_image) {
    const { deleteOfferBanner } = await import('./upload.service.js');
    await deleteOfferBanner(existingOffer.banner_image).catch(err => logger.error(`Failed to delete old offer banner: ${err.message}`));
  }

  const { data, error } = await supabaseAdmin
    .from('offers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update offer');
  }

  return data;
};

export const deleteOffer = async (id) => {
  // Fetch offer first to get image URL
  const { data: offer } = await supabaseAdmin
    .from('offers')
    .select('banner_image')
    .eq('id', id)
    .single();

  if (offer && offer.banner_image) {
    const { deleteOfferBanner } = await import('./upload.service.js');
    await deleteOfferBanner(offer.banner_image);
  }

  const { error } = await supabaseAdmin
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete offer');
  }

  return true;
};

