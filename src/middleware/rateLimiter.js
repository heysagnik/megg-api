import rateLimit from 'express-rate-limit';
import { redis } from '../utils/cache.js';

const createRedisStore = () => {
  if (!redis) {
    return undefined;
  }

  return {
    async increment(key) {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, 900);
      }
      return { totalHits: current, resetTime: new Date(Date.now() + 900000) };
    },
    async decrement(key) {
      await redis.decr(key);
    },
    async resetKey(key) {
      await redis.del(key);
    }
  };
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore()
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore()
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many admin requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore()
});

