const logger = require('../config/logger');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Determine error type and status code
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation Error';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorMessage = 'Database Validation Error';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorMessage = 'Resource already exists';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    errorMessage = 'Invalid reference';
  } else if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    errorMessage = 'Database connection error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Resource not found';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    errorMessage = 'Service unavailable';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Service connection refused';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    errorMessage = 'Request timeout';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
}

module.exports = errorHandler;
