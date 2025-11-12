import { supabaseAdmin } from '../config/supabase.js';

export const getUserWishlist = async (userId) => {
  const { data: wishlistItems, error: wishlistError } = await supabaseAdmin
    .from('wishlist')
    .select('id, product_id, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (wishlistError) {
    throw new Error(`Failed to fetch wishlist: ${wishlistError.message}`);
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return [];
  }

  const productIds = wishlistItems.map(item => item.product_id);

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, brand, images, category, color, affiliate_link')
    .in('id', productIds);

  if (productsError) {
    throw new Error(`Failed to fetch wishlist products: ${productsError.message}`);
  }

  return wishlistItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return {
      ...product,
      wishlist_id: item.id,
      added_at: item.added_at
    };
  }).filter(item => item.id);
};

export const addToWishlist = async (userId, productId) => {
  const { data: existing } = await supabaseAdmin
    .from('wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    return { message: 'Product already in wishlist', id: existing.id };
  }

  const { data, error } = await supabaseAdmin
    .from('wishlist')
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add to wishlist: ${error.message}`);
  }

  return data;
};

export const removeFromWishlist = async (userId, productId) => {
  const { error } = await supabaseAdmin
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    throw new Error(`Failed to remove from wishlist: ${error.message}`);
  }

  return true;
};

