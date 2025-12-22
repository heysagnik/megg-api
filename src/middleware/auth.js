import { auth } from '../config/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import * as authService from '../services/auth.service.js';

export const authenticate = async (req, res, next) => {
  try {
    // Try better-auth cookie session first (for web)
    let session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    // Fallback: Check Bearer token (for mobile)
    if (!session) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const dbSession = await authService.validateSession(token);
        if (dbSession) {
          session = {
            user: {
              id: dbSession.userId,
              email: dbSession.email,
              name: dbSession.name,
              image: dbSession.image
            },
            session: { token }
          };
        }
      }
    }

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
    let session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    // Fallback: Check Bearer token (for mobile)
    if (!session) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const dbSession = await authService.validateSession(token);
        if (dbSession) {
          session = {
            user: {
              id: dbSession.userId,
              email: dbSession.email,
              name: dbSession.name,
              image: dbSession.image
            },
            session: { token }
          };
        }
      }
    }

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
