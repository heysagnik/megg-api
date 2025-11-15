import * as fcmService from '../services/fcm.service.js';
import { validate } from '../middleware/validate.js';
import { sendNotificationSchema } from '../validators/fcm.validators.js';

// Send notification to all users (Admin only)
export const sendNotification = async (req, res, next) => {
  try {
    await validate(sendNotificationSchema)({ body: req.body }, res, () => {});

    const { title, body, image, link } = req.body;
    const result = await fcmService.sendNotificationToAll(title, body, image, link);

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get all sent notifications (Public)
export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await fcmService.getNotifications({ page, limit });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
