import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, requireAdmin, notificationController.createNotification);
router.get('/', notificationController.listNotifications);
router.get('/:id', notificationController.getNotificationById);
router.delete('/:id', authenticate, requireAdmin, notificationController.deleteNotification);

export default router;
