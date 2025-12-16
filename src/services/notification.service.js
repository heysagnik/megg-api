import { sql } from '../config/neon.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createNotificationSchema } from '../validators/notification.validators.js';

export const createNotification = async (notificationData) => {
  const validation = createNotificationSchema.safeParse(notificationData);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const validData = validation.data;
  const keys = Object.keys(validData);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => validData[k]);


  const [notification] = await sql(`INSERT INTO notifications (${cols}) VALUES (${vals}) RETURNING *`, values);

  if (!notification) throw new Error('Failed to create notification');
  return notification;
};

export const listNotifications = async ({ page = 1, limit = 20 }) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [notifications, countResult] = await Promise.all([
    sql('SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2', [l, offset]),
    sql('SELECT COUNT(*)::int FROM notifications')
  ]);

  const count = countResult[0]?.count || 0;
  if (!notifications) throw new Error('Failed to fetch notifications');

  return {
    notifications: notifications || [],
    total: count,
    page: p,
    limit: l,
    totalPages: Math.ceil(count / l)
  };
};

export const getNotificationById = async (id) => {
  const [data] = await sql('SELECT * FROM notifications WHERE id = $1 LIMIT 1', [id]);
  if (!data) throw new NotFoundError('Notification not found');
  return data;
};

export const deleteNotification = async (id) => {
  const [notification] = await sql('SELECT image FROM notifications WHERE id = $1 LIMIT 1', [id]);
  if (notification?.image) {
    const { deleteProductImage } = await import('./upload.service.js');
    await deleteProductImage(notification.image);
  }
  await sql('DELETE FROM notifications WHERE id = $1', [id]);
  return true;
};
