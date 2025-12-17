import { Router } from 'express';
import * as fcmController from '../controllers/fcm.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

// Public routes
router.get('/', fcmController.getNotifications);

// Admin routes (API key required)
router.post('/send', apiKeyAuth, fcmController.sendNotification);

export default router;
