import express from 'express';
import * as bannerController from '../controllers/banner.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadBannerHandler } from '../middleware/upload.js';
import {
  createBannerSchema,
  updateBannerSchema,
  bannerIdSchema
} from '../validators/banner.validators.js';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', generalLimiter, bannerController.listBanners);
router.get('/:id', generalLimiter, validate(bannerIdSchema), bannerController.getBanner);

router.post(
  '/', 
  authenticate, 
  requireAdmin, 
  adminLimiter, 
  uploadBannerHandler,
  validate(createBannerSchema), 
  bannerController.createBanner
);

router.put(
  '/:id', 
  authenticate, 
  requireAdmin, 
  adminLimiter, 
  uploadBannerHandler,
  validate(updateBannerSchema), 
  bannerController.updateBanner
);

router.delete('/:id', authenticate, requireAdmin, adminLimiter, validate(bannerIdSchema), bannerController.deleteBanner);

export default router;

