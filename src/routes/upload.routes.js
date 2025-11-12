import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadVideoHandler, uploadImages } from '../middleware/upload.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post(
  '/video',
  authenticate,
  requireAdmin,
  adminLimiter,
  uploadVideoHandler,
  uploadController.uploadReelVideo
);

router.post(
  '/image',
  authenticate,
  requireAdmin,
  adminLimiter,
  uploadImages.single('image'),
  uploadController.uploadImage
);

export default router;

