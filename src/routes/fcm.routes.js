import { Router } from 'express';
import * as fcmController from '../controllers/fcm.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Send notification to all users (Admin only)
router.post('/send', authenticate, requireAdmin, fcmController.sendNotification);

// Get all sent notifications (Public)
router.get('/', fcmController.getNotifications);

export default router;
