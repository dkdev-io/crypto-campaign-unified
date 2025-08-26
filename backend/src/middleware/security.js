import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

// Simple HTML/XSS sanitizer without DOMPurify dependency for tests
const simpleSanitize = (content) => {
  if (typeof content !== 'string') return content;
  
  return content
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<svg[^>]*onload[^>]*>/gi, '<svg>')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<video[^>]*onerror[^>]*>/gi, '<video>')
    .replace(/<audio[^>]*onerror[^>]*>/gi, '<audio>')
    .replace(/<img[^>]*onerror[^>]*>/gi, (match) => {
      return match.replace(/onerror\s*=\s*["'][^"']*["']/gi, '');
    })
    .replace(/<div[^>]*onclick[^>]*>/gi, (match) => {
      return match.replace(/onclick\s*=\s*["'][^"']*["']/gi, '');
    });
};

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  next();
};

/**
 * XSS Prevention Middleware
 */
export const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = simpleSanitize(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? simpleSanitize(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * JWT Authentication Middleware
 */
export const authenticate = (secretKey = process.env.JWT_SECRET) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ 
          error: 'No authorization header provided',
          code: 'AUTH_HEADER_MISSING'
        });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Invalid authorization header format',
          code: 'AUTH_HEADER_INVALID'
        });
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        return res.status(401).json({ 
          error: 'No token provided',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, secretKey);
      req.user = decoded;
      
      // Log authentication event
      logger.info('User authenticated', {
        userId: decoded.id,
        role: decoded.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      logger.warn('Authentication failed', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'TOKEN_INVALID'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(500).json({ 
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Role-based Authorization Middleware
 */
export const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        requiredRole,
        userRole: req.user.role,
        ip: req.ip
      });

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * SQL Injection Prevention - Input Validation
 */
export const validateInput = [
  // Common validation rules
  body('*').customSanitizer((value) => {
    if (typeof value === 'string') {
      // Remove potential SQL injection patterns
      return value.replace(/['"\\;]/g, '').trim();
    }
    return value;
  }),
  
  // Custom validator to check for SQL injection patterns
  body('*').custom((value) => {
    if (typeof value === 'string') {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(-{2,}|\/\*|\*\/)/,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(CHAR\(|CONCAT\(|SUBSTRING\()/i
      ];
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          throw new Error('Input contains potentially dangerous characters');
        }
      }
    }
    return true;
  })
];

/**
 * Rate Limiting Configurations
 */
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP address and user ID (if authenticated) for more granular limiting
      return req.user ? `${req.ip}-${req.user.id}` : req.ip;
    },
    handler: (req, res) => {
      logger.warn('Rate limit reached', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        limit: max,
        windowMs: windowMs
      });
      
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000 / 60) + ' minutes'
      });
    }
  });
};

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // General API rate limiting
  general: createRateLimit(15 * 60 * 1000, 100, 'Too many requests'),
  
  // Stricter rate limiting for sensitive operations
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  
  // Very strict rate limiting for contributions
  contributions: createRateLimit(5 * 60 * 1000, 10, 'Too many contribution attempts'),
  
  // Moderate rate limiting for KYC submissions
  kyc: createRateLimit(60 * 60 * 1000, 3, 'Too many KYC submissions per hour')
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self'; frame-ancestors 'none';"
  );
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Request Size Limiting
 */
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize,
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

/**
 * Helper function to parse size strings
 */
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

/**
 * Honeypot Field Detection (Bot Prevention)
 */
export const honeypotProtection = (fieldName = 'website') => {
  return (req, res, next) => {
    // If the honeypot field is filled, it's likely a bot
    if (req.body[fieldName] && req.body[fieldName].trim() !== '') {
      logger.warn('Honeypot field filled - potential bot detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        honeypotValue: req.body[fieldName]
      });
      
      return res.status(400).json({
        error: 'Invalid form submission',
        code: 'INVALID_SUBMISSION'
      });
    }
    
    // Remove honeypot field from request body
    delete req.body[fieldName];
    next();
  };
};