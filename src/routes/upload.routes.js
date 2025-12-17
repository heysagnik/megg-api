import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { uploadVideoHandler, uploadImages } from '../middleware/upload.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import { uploadVideoSchema, uploadImageSchema } from '../validators/upload.validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Admin routes (API key required)
router.post(
  '/video',
  apiKeyAuth,
  adminLimiter,
  uploadVideoHandler,
  validate(uploadVideoSchema),
  uploadController.uploadReelVideo
);

router.post(
  '/image',
  apiKeyAuth,
  adminLimiter,
  uploadImages.single('image'),
  validate(uploadImageSchema),
  uploadController.uploadImage
);

export default router;
