import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import { mobileGoogleAuthSchema } from '../validators/auth.validators.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Mobile Google Sign-In
router.post('/mobile/google', authLimiter, validate(mobileGoogleAuthSchema), authController.mobileGoogleAuth);

// Session check
router.get('/check', authController.checkSession);

// Logout
router.post('/logout', authController.logout);

// Admin status (API key protected)
router.get('/admin/status', apiKeyAuth, (req, res) => {
    res.json({ success: true, isAdmin: true });
});

export default router;
