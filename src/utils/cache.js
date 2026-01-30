import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const memoryCache = new Map();
const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const CACHE_TTL = {
  PRODUCT_DETAIL: 1800,
  PRODUCT_LIST: 300,
  RECOMMENDATIONS: 1800,
  VARIANTS: 1800,
  COLOR_COMBOS: 1800,
  TRENDING_PRODUCTS: 300,
  CATEGORY_BANNERS: 900,
  OFFERS: 300,
  CATEGORIES: 3600,
  SUBCATEGORIES: 3600,
  SEARCH_RESULTS: 60,
  REELS: 900,
  OUTFITS: 900,
  NOTIFICATIONS: 300,
  SESSION: 3600
};

export const getCached = async (key, ttlSeconds, fetchFn) => {
  try {
    if (isRedisConfigured) {
      const cached = await redis.get(key);
      if (cached !== null) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }

      const data = await fetchFn();
      redis.setex(key, ttlSeconds, JSON.stringify(data)).catch(() => {});
      return data;
    }

    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttlSeconds * 1000) {
      return cached.data;
    }

    const data = await fetchFn();
    memoryCache.set(key, { data, timestamp: now });
    return data;
  } catch (error) {
    return fetchFn();
  }
};

export const setCache = async (key, data, ttlSeconds) => {
  try {
    if (isRedisConfigured) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } else {
      memoryCache.set(key, { data, timestamp: Date.now() });
    }
  } catch (error) {}
};

export const getCache = async (key) => {
  try {
    if (isRedisConfigured) {
      const cached = await redis.get(key);
      if (cached !== null) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
      return null;
    }

    const cached = memoryCache.get(key);
    return cached ? cached.data : null;
  } catch (error) {
    return null;
  }
};

export const invalidateCache = async (key) => {
  try {
    if (isRedisConfigured) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {}
};

export const invalidateCacheByPrefix = async (prefix) => {
  try {
    if (isRedisConfigured) {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) await redis.del(...keys);
    } else {
      for (const key of memoryCache.keys()) {
        if (key.startsWith(prefix)) memoryCache.delete(key);
      }
    }
  } catch (error) {}
};

export const clearCache = async () => {
  try {
    if (isRedisConfigured) {
      await redis.flushdb();
    } else {
      memoryCache.clear();
    }
  } catch (error) {}
};

export const getCacheStats = async () => {
  try {
    if (isRedisConfigured) {
      const dbSize = await redis.dbsize();
      return { type: 'redis', totalKeys: dbSize, connected: true };
    }
    return { type: 'memory', totalKeys: memoryCache.size, connected: false };
  } catch (error) {
    return { type: 'error', error: error.message };
  }
};

export const isRedisEnabled = () => isRedisConfigured;
