import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Production error response
  res.status(err.status || 500).json({
    error: err.status >= 400 && err.status < 500 
      ? err.message 
      : 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};