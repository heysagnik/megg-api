import express from 'express';
import * as reelController from '../controllers/reel.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import {
  createReelSchema,
  updateReelSchema,
  reelIdSchema,
  categorySchema
} from '../validators/reel.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', generalLimiter, reelController.listAllReels);
router.get('/liked', generalLimiter, reelController.getLikedReels); // Removed auth - will work without login
router.get('/category/:category', generalLimiter, validate(categorySchema), reelController.listReelsByCategory);
router.get('/:id/products', generalLimiter, validate(reelIdSchema), reelController.getReelWithProducts);
router.post('/:id/view', generalLimiter, validate(reelIdSchema), reelController.incrementViews);
router.post('/:id/like', generalLimiter, validate(reelIdSchema), reelController.incrementLikes);

// Admin routes (API key required)
router.post('/', apiKeyAuth, adminLimiter, validate(createReelSchema), reelController.createReel);
router.put('/:id', apiKeyAuth, adminLimiter, validate(updateReelSchema), reelController.updateReel);
router.delete('/:id', apiKeyAuth, adminLimiter, validate(reelIdSchema), reelController.deleteReel);

export default router;
