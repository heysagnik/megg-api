import { auth } from '../config/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export const authenticate = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
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
