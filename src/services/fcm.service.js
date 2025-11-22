import { supabaseAdmin } from '../config/supabase.js';
import { getMessaging } from '../config/firebase.js';
import logger from '../utils/logger.js';

// Send notification to all users and save to database
export const sendNotificationToAll = async (title, body, image, link) => {
  const messaging = getMessaging();

  // Save notification to database first
  const { data: notification, error: dbError } = await supabaseAdmin
    .from('notifications')
    .insert({
      title,
      description: body,
      image,
      link
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Failed to save notification: ${dbError.message}`);
  }

  // Send to FCM topic (all users subscribed to 'all-users' topic)
  const message = {
    topic: 'all-users',
    notification: {
      title,
      body
    },
    data: {
      notification_id: notification.id,
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
    // Notification is still saved in DB even if FCM fails
    return {
      success: true,
      notification,
      fcm_error: error.message
    };
  }
};

// Get all notifications (paginated)
export const getNotifications = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return {
    notifications: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
};
