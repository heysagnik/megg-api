import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import { clickAnalyticsSchema } from '../validators/analytics.validators.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Simple API key auth for all admin routes
router.use(apiKeyAuth, adminLimiter);

router.get('/analytics/overview', adminController.getOverviewAnalytics);
router.get('/analytics/trending', adminController.getTrendingAnalytics);
router.get('/analytics/clicks', validate(clickAnalyticsSchema), adminController.getClickAnalytics);

export default router;
