import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  // Prepare detailed context
  const errorContext = {
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  if (err instanceof AppError) {
    logger.warn('Application error occurred', {
      error: err.message,
      statusCode: err.statusCode,
      ...errorContext
    });
    
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  if (err.name === 'ZodError') {
    logger.warn('Validation error occurred', {
      errors: err.errors,
      ...errorContext
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors
    });
  }

  // Log unhandled errors with full details
  logger.error('UNHANDLED ERROR', {
    errorName: err.name,
    errorMessage: err.message,
    errorCode: err.code,
    errorStack: err.stack,
    ...errorContext
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error'
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

