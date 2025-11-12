import { supabase, supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError } from '../utils/errors.js';

export const exchangeGoogleToken = async (token) => {
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new UnauthorizedError('Invalid Google token');
  }

  return data.user;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Failed to fetch user profile');
  }

  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update user profile');
  }

  return data;
};

export const checkAdminStatus = async (userId) => {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  return adminIds.includes(userId);
};

