import { supabase, supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];

    if (!adminIds.includes(req.user.id)) {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

