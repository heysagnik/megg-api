import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors
    });
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

