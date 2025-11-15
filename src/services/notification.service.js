import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

export const createNotification = async (notificationData) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data;
};

export const listNotifications = async ({ page = 1, limit = 20 }) => {
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

export const getNotificationById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new NotFoundError('Notification not found');
  }

  return data;
};

export const deleteNotification = async (id) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }

  return true;
};
