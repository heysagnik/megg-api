import { invalidateCache, invalidateCacheByPrefix } from './cache.js';

const WORKER_URL = process.env.CLOUDFLARE_WORKER_URL;
const PURGE_TOKEN = process.env.CLOUDFLARE_PURGE_TOKEN;

const purgeWorkerCache = async (paths) => {
  if (!WORKER_URL || !PURGE_TOKEN) return;

  try {
    await fetch(`${WORKER_URL}/__worker/purge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PURGE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paths })
    });
  } catch (error) {}
};

export const invalidateProductCache = async (productId) => {
  await Promise.all([
    invalidateCache(`product:${productId}`),
    invalidateCacheByPrefix(`products:`),
    invalidateCacheByPrefix(`search:`),
    invalidateCacheByPrefix(`recs:`),
    invalidateCacheByPrefix(`variants:`),
    invalidateCacheByPrefix(`related:`),
    invalidateCacheByPrefix(`subrecs:`)
  ]).catch(() => {});

  purgeWorkerCache([
    `/api/products/${productId}`,
    `/api/products/${productId}/recommendations`,
    `/api/products/${productId}/variants`
  ]).catch(() => {});
};

export const invalidateReelCache = async (reelId) => {
  await Promise.all([
    invalidateCache(`reel:${reelId}`),
    invalidateCacheByPrefix(`reels:`)
  ]).catch(() => {});

  purgeWorkerCache([
    `/api/reels/${reelId}`,
    `/api/reels`
  ]).catch(() => {});
};

export const invalidateComboCache = async (comboId) => {
  await Promise.all([
    invalidateCache(`combo:${comboId}`),
    invalidateCacheByPrefix(`color-combos:`),
    invalidateCacheByPrefix(`color_combos:`)
  ]).catch(() => {});

  purgeWorkerCache([
    `/api/color-combos/${comboId}`,
    `/api/color-combos`
  ]).catch(() => {});
};

export const invalidateBannerCache = async () => {
  await invalidateCacheByPrefix(`banners:`).catch(() => {});
  purgeWorkerCache([`/api/banners`]).catch(() => {});
};

export const invalidateOfferCache = async (offerId) => {
  await Promise.all([
    offerId ? invalidateCache(`offer:${offerId}`) : Promise.resolve(),
    invalidateCacheByPrefix(`offers:`)
  ]).catch(() => {});

  purgeWorkerCache([`/api/offers`]).catch(() => {});
};

export const invalidateOutfitCache = async (outfitId) => {
  await Promise.all([
    outfitId ? invalidateCache(`outfit:${outfitId}`) : Promise.resolve(),
    invalidateCacheByPrefix(`outfits:`)
  ]).catch(() => {});

  purgeWorkerCache([`/api/outfits`]).catch(() => {});
};

export const invalidateSubcategoryCache = async () => {
  await invalidateCacheByPrefix(`subcategories:`).catch(() => {});
  purgeWorkerCache([`/api/subcategories`]).catch(() => {});
};

export const invalidateCategoryCache = async () => {
  await invalidateCacheByPrefix(`categories:`).catch(() => {});
  purgeWorkerCache([`/api/categories`]).catch(() => {});
};

export const invalidateTrendingCache = async () => {
  await invalidateCacheByPrefix(`trending:`).catch(() => {});
  purgeWorkerCache([`/api/trending`]).catch(() => {});
};

export const invalidateSearchCache = async () => {
  await Promise.all([
    invalidateCacheByPrefix(`search:`),
    invalidateCacheByPrefix(`hybrid:`)
  ]).catch(() => {});
};

export const invalidateAllCaches = async () => {
  await Promise.all([
    invalidateCacheByPrefix(`product:`),
    invalidateCacheByPrefix(`products:`),
    invalidateCacheByPrefix(`reel:`),
    invalidateCacheByPrefix(`reels:`),
    invalidateCacheByPrefix(`combo:`),
    invalidateCacheByPrefix(`color-combos:`),
    invalidateCacheByPrefix(`color_combos:`),
    invalidateCacheByPrefix(`banners:`),
    invalidateCacheByPrefix(`offers:`),
    invalidateCacheByPrefix(`outfits:`),
    invalidateCacheByPrefix(`subcategories:`),
    invalidateCacheByPrefix(`categories:`),
    invalidateCacheByPrefix(`trending:`),
    invalidateCacheByPrefix(`search:`),
    invalidateCacheByPrefix(`hybrid:`)
  ]).catch(() => {});
};
