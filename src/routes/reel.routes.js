import express from 'express';
import * as reelController from '../controllers/reel.controller.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createReelSchema,
  updateReelSchema,
  reelIdSchema,
  categorySchema
} from '../validators/reel.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', generalLimiter, reelController.listAllReels);
router.get('/liked', authenticate, generalLimiter, reelController.getLikedReels);
router.get('/category/:category', generalLimiter, validate(categorySchema), reelController.listReelsByCategory);
router.get('/:id/products', generalLimiter, validate(reelIdSchema), reelController.getReelWithProducts);
router.post('/:id/view', generalLimiter, validate(reelIdSchema), reelController.incrementViews);
router.post('/:id/like', optionalAuth, generalLimiter, validate(reelIdSchema), reelController.incrementLikes);

router.post('/', authenticate, requireAdmin, adminLimiter, validate(createReelSchema), reelController.createReel);
router.put('/:id', authenticate, requireAdmin, adminLimiter, validate(updateReelSchema), reelController.updateReel);
router.delete('/:id', authenticate, requireAdmin, adminLimiter, validate(reelIdSchema), reelController.deleteReel);

export default router;

