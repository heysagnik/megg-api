import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

export const listOutfits = async () => {
  const { data, error } = await supabaseAdmin
    .from('outfits')
    .select('id, title, banner_image, affiliate_link, created_at')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    throw new Error('Failed to fetch outfits');
  }

  return data || [];
};

export const getOutfitById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('outfits')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Outfit not found');
  }

  return data;
};

export const createOutfit = async (outfitData) => {
  const { data, error } = await supabaseAdmin
    .from('outfits')
    .insert(outfitData)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create outfit');
  }

  return data;
};

export const updateOutfit = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('outfits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update outfit');
  }

  return data;
};

export const deleteOutfit = async (id) => {
  const { error } = await supabaseAdmin
    .from('outfits')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete outfit');
  }

  return true;
};

