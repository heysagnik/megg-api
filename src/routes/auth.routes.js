import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { googleAuthSchema, updateProfileSchema, mobileGoogleAuthSchema } from '../validators/auth.validators.js';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/google', authLimiter, validate(googleAuthSchema), authController.googleAuth);
router.post('/mobile/google', authLimiter, validate(mobileGoogleAuthSchema), authController.mobileGoogleAuth);

router.get('/profile', authenticate, generalLimiter, authController.getProfile);
router.put('/profile', authenticate, generalLimiter, validate(updateProfileSchema), authController.updateProfile);

router.get('/admin/status', authenticate, generalLimiter, authController.checkAdminStatus);

export default router;

