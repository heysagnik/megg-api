import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

let colorCombosCache = null;
let cacheTime = null;
const CACHE_DURATION = 3600000;

export const listColorCombos = async (groupType = null) => {
  if (!groupType && colorCombosCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return colorCombosCache;
  }

  let query = supabaseAdmin
    .from('color_combos')
    .select('*');

  if (groupType) {
    query = query.eq('group_type', groupType);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch color combos');
  }

  if (!groupType) {
    colorCombosCache = data;
    cacheTime = Date.now();
  }

  return data;
};

export const getColorComboProducts = async (id) => {
  const { data: combo, error: comboError } = await supabaseAdmin
    .from('color_combos')
    .select('*')
    .eq('id', id)
    .single();

  if (comboError || !combo) {
    throw new NotFoundError('Color combo not found');
  }

  if (combo.product_ids && combo.product_ids.length > 0) {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, price, brand, images, category, color, affiliate_link')
      .in('id', combo.product_ids);

    return { combo, products: products || [] };
  }

  return { combo, products: [] };
};

export const createColorCombo = async (comboData) => {
  const { data, error } = await supabaseAdmin
    .from('color_combos')
    .insert(comboData)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create color combo');
  }

  colorCombosCache = null;

  return data;
};

export const updateColorCombo = async (id, updates) => {
  // Fetch existing combo to check for image changes
  const { data: existingCombo } = await supabaseAdmin
    .from('color_combos')
    .select('model_image')
    .eq('id', id)
    .single();

  if (existingCombo && updates.model_image && existingCombo.model_image !== updates.model_image) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(existingCombo.model_image).catch(err => console.error('Failed to delete old color combo image:', err));
  }

  const { data, error } = await supabaseAdmin
    .from('color_combos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update color combo');
  }

  colorCombosCache = null;
  return data;
};

export const deleteColorCombo = async (id) => {
  // Fetch combo first to get image URL
  const { data: combo } = await supabaseAdmin
    .from('color_combos')
    .select('model_image')
    .eq('id', id)
    .single();

  if (combo && combo.model_image) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(combo.model_image);
  }

  const { data, error } = await supabaseAdmin
    .from('color_combos')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to delete color combo');
  }

  colorCombosCache = null;
  return true;
};

