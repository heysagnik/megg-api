import { ForbiddenError } from '../utils/errors.js';

/**
 * Simple API Key authentication middleware for admin routes.
 * Checks for X-Admin-Key header and validates against ADMIN_API_KEY env variable.
 * 
 * Usage: Add 'X-Admin-Key: your-secret-key' header to requests
 */
export const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-admin-key'];
    const validKey = process.env.ADMIN_API_KEY;

    if (!validKey) {
        return next(new ForbiddenError('Server configuration error'));
    }

    if (!apiKey) {
        return next(new ForbiddenError('API key required. Add X-Admin-Key header.'));
    }

    if (apiKey !== validKey) {
        return next(new ForbiddenError('Invalid API key'));
    }

    req.isAdmin = true;
    next();
};

/**
 * Optional API key check - doesn't fail if no key provided
 */
export const optionalApiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-admin-key'];
    const validKey = process.env.ADMIN_API_KEY;

    if (apiKey && validKey && apiKey === validKey) {
        req.isAdmin = true;
    }

    next();
};
