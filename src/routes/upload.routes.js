import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadVideoHandler, uploadImages } from '../middleware/upload.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

import { uploadVideoSchema, uploadImageSchema } from '../validators/upload.validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/video',
  authenticate,
  requireAdmin,
  adminLimiter,
  uploadVideoHandler,
  validate(uploadVideoSchema),
  uploadController.uploadReelVideo
);

router.post(
  '/image',
  authenticate,
  requireAdmin,
  adminLimiter,
  uploadImages.single('image'),
  validate(uploadImageSchema),
  uploadController.uploadImage
);

export default router;

