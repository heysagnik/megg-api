import express from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import { uploadBannerHandler } from '../middleware/upload.js';
import {
  createBannerSchema,
  updateBannerSchema,
  bannerIdSchema
} from '../validators/banner.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', generalLimiter, bannerController.listBanners);
router.get('/:id', generalLimiter, validate(bannerIdSchema), bannerController.getBanner);

// Admin routes (API key required)
router.post(
  '/',
  apiKeyAuth,
  adminLimiter,
  uploadBannerHandler,
  validate(createBannerSchema),
  bannerController.createBanner
);

router.put(
  '/:id',
  apiKeyAuth,
  adminLimiter,
  uploadBannerHandler,
  validate(updateBannerSchema),
  bannerController.updateBanner
);

router.delete('/:id', apiKeyAuth, adminLimiter, validate(bannerIdSchema), bannerController.deleteBanner);

export default router;
