import * as notificationService from '../services/notification.service.js';
import { validate } from '../middleware/validate.js';
import { createNotificationSchema, notificationIdSchema } from '../validators/notification.validators.js';

export const createNotification = async (req, res, next) => {
  try {
    await validate(createNotificationSchema)({ body: req.body }, res, () => {});

    const notification = await notificationService.createNotification(req.body);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const listNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await notificationService.listNotifications({ page, limit });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    await validate(notificationIdSchema)({ params: req.params }, res, () => {});

    const notification = await notificationService.getNotificationById(req.params.id);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await validate(notificationIdSchema)({ params: req.params }, res, () => {});

    await notificationService.deleteNotification(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
