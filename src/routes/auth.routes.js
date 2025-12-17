import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import { googleAuthSchema, updateProfileSchema, mobileGoogleAuthSchema } from '../validators/auth.validators.js';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Mobile user auth routes (if you still need user authentication for mobile app)
router.post('/google', authLimiter, validate(googleAuthSchema), authController.googleAuth);
router.post('/mobile/google', authLimiter, validate(mobileGoogleAuthSchema), authController.mobileGoogleAuth);

// Admin status check using API key
router.get('/admin/status', apiKeyAuth, (req, res) => {
    res.json({ success: true, isAdmin: true });
});

export default router;
