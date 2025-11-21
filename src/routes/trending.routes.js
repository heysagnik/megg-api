import express from 'express';
import * as trendingController from '../controllers/trending.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { publicCache } from '../middleware/cacheControl.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const productIdSchema = z.object({
  params: z.object({
    productId: z.string().uuid()
  })
});

router.get('/products', generalLimiter, publicCache(300), trendingController.getTrendingProducts);
router.post('/click/:productId', optionalAuth, generalLimiter, validate(productIdSchema), trendingController.trackClick);

export default router;

