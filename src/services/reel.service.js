import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

export const listAllReels = async () => {
  const { data: reels, error } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, affiliate_link, views, likes, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch reels');
  }

  return reels || [];
};

export const listReelsByCategory = async (category) => {
  const { data: reels, error } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, affiliate_link, views, likes, created_at')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch reels');
  }

  return reels || [];
};

export const getReelWithProducts = async (id) => {
  const { data: reel, error } = await supabaseAdmin
    .from('reels')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !reel) {
    throw new NotFoundError('Reel not found');
  }

  if (reel.product_ids && reel.product_ids.length > 0) {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, price, brand, images, category, color, affiliate_link')
      .in('id', reel.product_ids);

    reel.products = products || [];
  } else {
    reel.products = [];
  }

  return reel;
};

export const createReel = async (reelData) => {
  const { data, error } = await supabaseAdmin
    .from('reels')
    .insert(reelData)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create reel');
  }

  return data;
};

export const updateReel = async (id, updates) => {
  const { data, error } = await supabaseAdmin
    .from('reels')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update reel');
  }

  return data;
};

export const deleteReel = async (id) => {
  const { data: reel, error: fetchError } = await supabaseAdmin
    .from('reels')
    .select('video_url')
    .eq('id', id)
    .single();

  if (fetchError || !reel) {
    throw new NotFoundError('Reel not found');
  }

  if (reel.video_url) {
    const { deleteReelVideo } = await import('./upload.service.js');
    await deleteReelVideo(reel.video_url);
  }

  const { error: deleteError } = await supabaseAdmin
    .from('reels')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw new Error(`Failed to delete reel: ${deleteError.message}`);
  }

  return true;
};

export const incrementReelViews = async (id) => {
  const { error } = await supabaseAdmin.rpc('increment_reel_views', { reel_id: id });

  if (error) {
    const { data: reel } = await supabaseAdmin
      .from('reels')
      .select('views')
      .eq('id', id)
      .single();

    if (reel) {
      await supabaseAdmin
        .from('reels')
        .update({ views: (reel.views || 0) + 1 })
        .eq('id', id);
    }
  }

  return true;
};

export const incrementReelLikes = async (id) => {
  const { error } = await supabaseAdmin.rpc('increment_reel_likes', { reel_id: id });

  if (error) {
    const { data: reel } = await supabaseAdmin
      .from('reels')
      .select('likes')
      .eq('id', id)
      .single();

    if (reel) {
      await supabaseAdmin
        .from('reels')
        .update({ likes: (reel.likes || 0) + 1 })
        .eq('id', id);
    }
  }

  return true;
};

export const decrementReelLikes = async (id) => {
  const { error } = await supabaseAdmin.rpc('decrement_reel_likes', { reel_id: id });

  if (error) {
    const { data: reel } = await supabaseAdmin
      .from('reels')
      .select('likes')
      .eq('id', id)
      .single();

    if (reel) {
      const newLikes = Math.max((reel.likes || 0) - 1, 0);
      await supabaseAdmin
        .from('reels')
        .update({ likes: newLikes })
        .eq('id', id);
    }
  }

  return true;
};

export const trackUserLike = async (reelId, userId) => {
  const { error } = await supabaseAdmin
    .from('reel_likes')
    .insert({ reel_id: reelId, user_id: userId });

  if (error && error.code !== '23505') {
    throw new Error('Failed to track like');
  }

  return true;
};

export const untrackUserLike = async (reelId, userId) => {
  await supabaseAdmin
    .from('reel_likes')
    .delete()
    .eq('reel_id', reelId)
    .eq('user_id', userId);

  return true;
};

export const getLikedReelsByUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { data: likes, error } = await supabaseAdmin
    .from('reel_likes')
    .select('reel_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch liked reels: ${error.message}`);
  }

  if (!likes || likes.length === 0) {
    return [];
  }

  const reelIds = likes.map(like => like.reel_id);

  if (reelIds.length === 0) {
    return [];
  }

  const { data: reels, error: reelsError } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, affiliate_link, views, likes, created_at')
    .in('id', reelIds)
    .order('created_at', { ascending: false });

  if (reelsError) {
    throw new Error(`Failed to fetch reels: ${reelsError.message}`);
  }

  return reels || [];
};

