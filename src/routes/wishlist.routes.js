import express from 'express';
import * as wishlistController from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addToWishlistSchema,
  removeFromWishlistSchema
} from '../validators/wishlist.validators.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', authenticate, generalLimiter, wishlistController.getWishlist);
router.post('/', authenticate, generalLimiter, validate(addToWishlistSchema), wishlistController.addToWishlist);
router.delete('/:productId', authenticate, generalLimiter, validate(removeFromWishlistSchema), wishlistController.removeFromWishlist);

export default router;

