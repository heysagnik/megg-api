import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const listAllReels = async () => {
  const { data: reels, error } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, product_ids, views, likes, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch all reels from database', {
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      query: 'reels - order by created_at desc'
    });
    throw new Error(`Failed to fetch reels: ${error.message} (Code: ${error.code})`);
  }

  logger.info(`Successfully fetched ${reels?.length || 0} reels`);
  return reels || [];
};

export const listReelsByCategory = async (category) => {
  logger.info(`Fetching reels for category: ${category}`);
  
  const { data: reels, error } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, product_ids, views, likes, created_at')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch reels by category', {
      category,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new Error(`Failed to fetch reels for category '${category}': ${error.message} (Code: ${error.code})`);
  }

  logger.info(`Successfully fetched ${reels?.length || 0} reels for category '${category}'`);
  return reels || [];
};

export const getReelWithProducts = async (id) => {
  logger.info(`Fetching reel with products`, { reelId: id });
  
  const { data: reel, error } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, product_ids, views, likes, created_at')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Failed to fetch reel from database', {
      reelId: id,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new NotFoundError(`Reel not found: ${error.message}`);
  }

  if (!reel) {
    logger.warn('Reel query returned no data', { reelId: id });
    throw new NotFoundError(`Reel with ID ${id} does not exist`);
  }

  if (reel.product_ids && reel.product_ids.length > 0) {
    logger.info(`Fetching ${reel.product_ids.length} products for reel`, { reelId: id, productIds: reel.product_ids });
    
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, brand, images, category, color, affiliate_link')
      .in('id', reel.product_ids);

    if (productsError) {
      logger.error('Failed to fetch products for reel', {
        reelId: id,
        productIds: reel.product_ids,
        errorMessage: productsError.message,
        errorCode: productsError.code
      });
      // Don't throw, just log and continue with empty products
      reel.products = [];
    } else {
      reel.products = products || [];
      logger.info(`Successfully fetched ${products?.length || 0} products for reel`, { reelId: id });
    }
  } else {
    reel.products = [];
  }

  return reel;
};

export const createReel = async (reelData) => {
  logger.info('Creating new reel', { category: reelData.category, productCount: reelData.product_ids?.length || 0 });
  
  const { data, error } = await supabaseAdmin
    .from('reels')
    .insert(reelData)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create reel in database', {
      reelData: { ...reelData, video_url: reelData.video_url?.substring(0, 50) + '...' }, // Truncate long URLs
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new Error(`Failed to create reel: ${error.message} (Code: ${error.code})`);
  }

  logger.info('Successfully created reel', { reelId: data.id, category: data.category });
  return data;
};

export const updateReel = async (id, updates) => {
  logger.info('Updating reel', { reelId: id, updateFields: Object.keys(updates) });
  
  // Fetch existing reel to check for video changes
  const { data: existingReel, error: fetchError } = await supabaseAdmin
    .from('reels')
    .select('video_url')
    .eq('id', id)
    .single();

  if (fetchError) {
    logger.error('Failed to fetch reel for update', {
      reelId: id,
      errorMessage: fetchError.message,
      errorCode: fetchError.code,
      errorDetails: fetchError.details,
      errorHint: fetchError.hint
    });
    throw new NotFoundError(`Reel not found: ${fetchError.message}`);
  }

  if (!existingReel) {
    logger.warn('Reel update failed - reel does not exist', { reelId: id });
    throw new NotFoundError(`Reel with ID ${id} does not exist`);
  }

  if (existingReel && updates.video_url && existingReel.video_url !== updates.video_url) {
    logger.info('Video URL changed, deleting old video', { reelId: id });
    const { deleteReelVideo } = await import('./upload.service.js');
    await deleteReelVideo(existingReel.video_url).catch(err => {
      logger.error('Failed to delete old reel video', {
        reelId: id,
        error: err.message
      });
    });
  }

  const { data, error } = await supabaseAdmin
    .from('reels')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update reel in database', {
      reelId: id,
      updates,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new Error(`Failed to update reel: ${error.message} (Code: ${error.code})`);
  }

  logger.info('Successfully updated reel', { reelId: id, updatedFields: Object.keys(updates) });
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

  const { data: reels, error: reelsError } = await supabaseAdmin
    .from('reels')
    .select('id, category, video_url, thumbnail_url, product_ids, views, likes, created_at')
    .in('id', reelIds)
    .order('created_at', { ascending: false });

  if (reelsError) {
    throw new Error(`Failed to fetch reels: ${reelsError.message}`);
  }

  return reels || [];
};

