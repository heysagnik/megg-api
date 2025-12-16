import { sql } from '../config/neon.js';
import { getMessaging } from '../config/firebase.js';
import logger from '../utils/logger.js';

export const sendNotificationToAll = async (title, body, image, link) => {
  const messaging = getMessaging();

  const [notification] = await sql(
    'INSERT INTO notifications (title, description, image, link) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, body, image, link]
  );

  if (!notification) throw new Error('Failed to save notification');

  const message = {
    topic: 'all-users',
    notification: { title, body },
    data: {
      notification_id: notification.id.toString(),
      link: link || ''
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        priority: 'high',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  if (image) {
    message.notification.imageUrl = image;
    message.android.notification.imageUrl = image;
    message.apns.payload.aps.mutableContent = 1;
    message.apns.fcmOptions = { imageUrl: image };
  }

  try {
    const response = await messaging.send(message);
    return {
      success: true,
      notification,
      fcm_message_id: response
    };
  } catch (error) {
    logger.error(`FCM send error: ${error.message}`);
    return {
      success: true,
      notification,
      fcm_error: error.message
    };
  }
};

export const getNotifications = async ({ page = 1, limit = 20 }) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const offset = (p - 1) * l;

  const [data, countResult] = await Promise.all([
    sql('SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2', [l, offset]),
    sql('SELECT COUNT(*)::int FROM notifications')
  ]);

  const count = countResult[0]?.count || 0;

  if (!data) throw new Error('Failed to fetch notifications');

  return {
    notifications: data || [],
    total: count || 0,
    page: p,
    limit: l,
    totalPages: Math.ceil((count || 0) / l)
  };
};
