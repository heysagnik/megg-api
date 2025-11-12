import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { clickAnalyticsSchema } from '../validators/analytics.validators.js';
import { adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate, requireAdmin, adminLimiter);

router.get('/analytics/overview', adminController.getOverviewAnalytics);
router.get('/analytics/trending', adminController.getTrendingAnalytics);
router.get('/analytics/clicks', validate(clickAnalyticsSchema), adminController.getClickAnalytics);

export default router;

