import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { TestHelpers } from '../utils/testHelpers.js';

// Mock JWT module
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

// Simple auth middleware for testing
const createAuthMiddleware = (secretKey = 'test-secret') => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Invalid authorization header format' });
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, secretKey);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
};

// Role-based authorization middleware
const createRoleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

describe('Authentication Middleware Tests', () => {
  let authMiddleware, req, res, next;

  beforeEach(() => {
    authMiddleware = createAuthMiddleware();
    req = TestHelpers.createMockRequest();
    res = TestHelpers.createMockResponse();
    next = TestHelpers.createMockNext();
    jest.clearAllMocks();
  });

  describe('Authentication Middleware', () => {
    it('should authenticate with valid token', () => {
      const mockUser = { id: '123', email: 'user@example.com', role: 'user' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockUser);

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No authorization header provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization header format', () => {
      req.headers.authorization = 'InvalidFormat token';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid authorization header format' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', () => {
      req.headers.authorization = 'Bearer ';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unexpected authentication errors', () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication error' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with custom secret key', () => {
      const customAuthMiddleware = createAuthMiddleware('custom-secret');
      const mockUser = { id: '123', role: 'admin' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockUser);

      customAuthMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'custom-secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Role-based Authorization Middleware', () => {
    let adminMiddleware, userMiddleware;

    beforeEach(() => {
      adminMiddleware = createRoleMiddleware('admin');
      userMiddleware = createRoleMiddleware('user');
    });

    it('should allow access with correct role', () => {
      req.user = { id: '123', role: 'admin' };

      adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access without authentication', () => {
      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access with insufficient role', () => {
      req.user = { id: '123', role: 'user' };

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow user role access to user endpoints', () => {
      req.user = { id: '123', role: 'user' };

      userMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow admin role access to user endpoints', () => {
      req.user = { id: '123', role: 'admin' };

      userMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Combined Authentication and Authorization', () => {
    let combinedMiddleware;

    beforeEach(() => {
      // Simulate combining auth and role middleware
      combinedMiddleware = (req, res, next, requiredRole = 'user') => {
        authMiddleware(req, res, (authError) => {
          if (authError) return;
          
          const roleMiddleware = createRoleMiddleware(requiredRole);
          roleMiddleware(req, res, next);
        });
      };
    });

    it('should authenticate and authorize successfully', () => {
      const mockUser = { id: '123', role: 'admin' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockUser);

      combinedMiddleware(req, res, next, 'admin');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject with authentication failure first', () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      combinedMiddleware(req, res, next, 'admin');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject with authorization failure after successful authentication', () => {
      const mockUser = { id: '123', role: 'user' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockUser);

      combinedMiddleware(req, res, next, 'admin');

      expect(jwt.verify).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed JWT tokens gracefully', () => {
      req.headers.authorization = 'Bearer malformed.jwt.token.with.extra.parts';
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle tokens with special characters', () => {
      req.headers.authorization = 'Bearer token-with-special-chars-!@#$%^&*()';
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle very long authorization headers', () => {
      const longToken = 'a'.repeat(10000);
      req.headers.authorization = `Bearer ${longToken}`;
      jwt.verify.mockImplementation(() => {
        throw new Error('Token too long');
      });

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication error' });
    });

    it('should not expose sensitive information in error messages', () => {
      req.headers.authorization = 'Bearer sensitive-token-with-secrets';
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date();
        throw error;
      });

      authMiddleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
      // Ensure no sensitive token information is leaked
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          expiredAt: expect.any(Date)
        })
      );
    });

    it('should handle null/undefined authorization headers', () => {
      req.headers.authorization = null;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No authorization header provided' });
    });

    it('should handle authorization headers with only Bearer', () => {
      req.headers.authorization = 'Bearer';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });
  });
});