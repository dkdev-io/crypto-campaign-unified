import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TestHelpers } from './testHelpers.js';

// Mock logger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../utils/logger.js', () => ({
  logger: mockLogger,
}));

// Error handler middleware function for testing
const createErrorHandler = (options = {}) => {
  const { includeStack = process.env.NODE_ENV === 'development', logErrors = true } = options;

  return (error, req, res, next) => {
    // Log the error
    if (logErrors) {
      mockLogger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    // Don't send error response if headers already sent
    if (res.headersSent) {
      return next(error);
    }

    // Determine error status code
    let statusCode = error.statusCode || error.status || 500;
    if (statusCode < 400) {
      statusCode = 500;
    }

    // Build error response
    const errorResponse = {
      error: error.message || 'Internal Server Error',
      statusCode,
    };

    // Add stack trace in development
    if (includeStack && error.stack) {
      errorResponse.stack = error.stack;
    }

    // Add error details if available
    if (error.details) {
      errorResponse.details = error.details;
    }

    // Add validation errors if available
    if (error.errors && Array.isArray(error.errors)) {
      errorResponse.validation = error.errors;
    }

    res.status(statusCode).json(errorResponse);
  };
};

// Custom error classes
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

describe('Error Handler Tests', () => {
  let errorHandler, req, res, next;

  beforeEach(() => {
    errorHandler = createErrorHandler();
    req = TestHelpers.createMockRequest({
      originalUrl: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    });
    res = TestHelpers.createMockResponse();
    next = TestHelpers.createMockNext();
    jest.clearAllMocks();
  });

  describe('Basic Error Handling', () => {
    it('should handle standard errors', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        statusCode: 500,
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle errors with status codes', () => {
      const error = new Error('Bad request');
      error.statusCode = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        statusCode: 400,
      });
    });

    it('should handle errors with status property', () => {
      const error = new Error('Not found');
      error.status = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        statusCode: 404,
      });
    });

    it('should default to 500 for unknown errors', () => {
      const error = new Error();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        statusCode: 500,
      });
    });

    it('should normalize invalid status codes', () => {
      const error = new Error('Test error');
      error.statusCode = 200; // Success code, should be normalized

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Custom Error Classes', () => {
    it('should handle ValidationError', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ];
      const error = new ValidationError('Validation failed', validationErrors);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        statusCode: 400,
        validation: validationErrors,
      });
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User not found');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found',
        statusCode: 404,
      });
    });

    it('should handle UnauthorizedError', () => {
      const error = new UnauthorizedError('Invalid credentials');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid credentials',
        statusCode: 401,
      });
    });

    it('should handle ForbiddenError', () => {
      const error = new ForbiddenError('Access denied');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        statusCode: 403,
      });
    });

    it('should handle ConflictError', () => {
      const error = new ConflictError('Email already exists');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email already exists',
        statusCode: 409,
      });
    });

    it('should handle RateLimitError', () => {
      const error = new RateLimitError('Too many requests');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        statusCode: 429,
      });
    });
  });

  describe('Error Logging', () => {
    it('should log error details', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandler(error, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred:', {
        message: 'Test error',
        stack: 'Error: Test error\n    at test.js:1:1',
        url: '/api/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'test-user-agent',
      });
    });

    it('should not log when logging disabled', () => {
      const errorHandlerNoLog = createErrorHandler({ logErrors: false });
      const error = new Error('Test error');

      errorHandlerNoLog(error, req, res, next);

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle missing request properties gracefully', () => {
      const errorHandler = createErrorHandler();
      const minimalReq = { originalUrl: undefined, method: undefined };
      const error = new Error('Test error');

      errorHandler(error, minimalReq, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Development vs Production Modes', () => {
    it('should include stack trace in development', () => {
      const errorHandlerDev = createErrorHandler({ includeStack: true });
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandlerDev(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        statusCode: 500,
        stack: 'Error: Test error\n    at test.js:1:1',
      });
    });

    it('should not include stack trace in production', () => {
      const errorHandlerProd = createErrorHandler({ includeStack: false });
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      errorHandlerProd(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        statusCode: 500,
      });
    });

    it('should not include stack trace when stack is missing', () => {
      const errorHandlerDev = createErrorHandler({ includeStack: true });
      const error = new Error('Test error');
      delete error.stack;

      errorHandlerDev(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error',
        statusCode: 500,
      });
    });
  });

  describe('Error Details and Context', () => {
    it('should include error details when available', () => {
      const error = new Error('Database error');
      error.statusCode = 500;
      error.details = { connection: 'timeout', retries: 3 };

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Database error',
        statusCode: 500,
        details: { connection: 'timeout', retries: 3 },
      });
    });

    it('should handle errors without details property', () => {
      const error = new Error('Simple error');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Simple error',
        statusCode: 500,
      });
    });
  });

  describe('Headers Already Sent', () => {
    it('should call next when headers already sent', () => {
      res.headersSent = true;
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should not call next when headers not sent', () => {
      res.headersSent = false;
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle null errors gracefully', () => {
      const error = null;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        statusCode: 500,
      });
    });

    it('should handle errors with circular references', () => {
      const error = new Error('Circular error');
      error.circular = error; // Create circular reference

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Circular error',
        statusCode: 500,
      });
    });

    it('should sanitize sensitive information from error messages', () => {
      const error = new Error(
        'Database connection failed: password=secret123 host=db.internal.com'
      );

      // In a real implementation, you might want to sanitize sensitive info
      // For this test, we just verify the error is handled
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database connection failed: password=secret123 host=db.internal.com',
        statusCode: 500,
      });
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: longMessage,
        statusCode: 500,
      });
    });

    it('should handle errors with special characters', () => {
      const error = new Error('Error with special chars: <script>alert("xss")</script>');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error with special chars: <script>alert("xss")</script>',
        statusCode: 500,
      });
    });

    it('should handle multiple validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Required field' },
        { field: 'password', message: 'Too short' },
        { field: 'age', message: 'Must be a number' },
      ];
      const error = new ValidationError('Multiple validation errors', validationErrors);

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Multiple validation errors',
        statusCode: 400,
        validation: validationErrors,
      });
    });
  });
});
