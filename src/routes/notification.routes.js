import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

// Public routes
router.get('/', notificationController.listNotifications);
router.get('/:id', notificationController.getNotificationById);

// Admin routes (API key required)
router.post('/', apiKeyAuth, notificationController.createNotification);
router.delete('/:id', apiKeyAuth, notificationController.deleteNotification);

export default router;
