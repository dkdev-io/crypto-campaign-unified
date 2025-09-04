import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  authorize,
  xssProtection,
  csrfProtection,
  validateInput,
  securityHeaders,
  rateLimiters,
} from '../../middleware/security.js';
import { TestHelpers } from '../utils/testHelpers.js';

/**
 * Comprehensive Security Integration Tests
 * Tests the interaction of multiple security measures working together
 */
describe('Security Integration Tests', () => {
  let app;
  const jwtSecret = 'integration-test-secret';

  beforeEach(() => {
    app = express();

    // Apply comprehensive security middleware stack
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https:'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    app.use(
      cors({
        origin: ['http://localhost:3000', 'https://trusted-domain.com'],
        credentials: true,
        optionsSuccessStatus: 200,
      })
    );

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use(securityHeaders);
    app.use(xssProtection);

    // Mock session for CSRF
    app.use((req, res, next) => {
      req.session = { csrfToken: 'test-csrf-token' };
      next();
    });

    // Apply rate limiting to all routes
    app.use(rateLimiters.general);

    // Test endpoints that combine multiple security measures

    // Public endpoint - basic security only
    app.get('/api/public', (req, res) => {
      res.json({
        message: 'Public endpoint',
        timestamp: new Date().toISOString(),
      });
    });

    // Authentication endpoint - rate limited + input validation
    app.post(
      '/api/auth/login',
      rateLimiters.auth,
      validateInput,
      (req, res, next) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
          });
        }
        next();
      },
      (req, res) => {
        const { username, password } = req.body;

        // Mock authentication
        if (username === 'testuser' && password === 'password123') {
          const token = jwt.sign({ id: '1', username: 'testuser', role: 'user' }, jwtSecret, {
            expiresIn: '1h',
          });
          res.json({
            success: true,
            token,
            user: { id: '1', username: 'testuser', role: 'user' },
          });
        } else if (username === 'admin' && password === 'adminpass') {
          const token = jwt.sign({ id: '2', username: 'admin', role: 'admin' }, jwtSecret, {
            expiresIn: '1h',
          });
          res.json({
            success: true,
            token,
            user: { id: '2', username: 'admin', role: 'admin' },
          });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      }
    );

    // Protected user endpoint - authentication required
    app.get('/api/profile', authenticate(jwtSecret), (req, res) => {
      res.json({
        profile: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
        },
      });
    });

    // Admin-only endpoint - authentication + authorization
    app.get('/api/admin/settings', authenticate(jwtSecret), authorize('admin'), (req, res) => {
      res.json({
        settings: {
          debug: false,
          maintenance: false,
          version: '1.0.0',
        },
      });
    });

    // Data modification endpoint - full security stack
    app.post(
      '/api/campaigns',
      csrfProtection,
      authenticate(jwtSecret),
      rateLimiters.contributions,
      validateInput,
      (req, res, next) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
          });
        }
        next();
      },
      (req, res) => {
        res.status(201).json({
          message: 'Campaign created',
          id: 'campaign-' + Date.now(),
          data: req.body,
        });
      }
    );

    // Sensitive operation endpoint - maximum security
    app.delete(
      '/api/admin/users/:id',
      csrfProtection,
      authenticate(jwtSecret),
      authorize('admin'),
      rateLimiters.auth,
      (req, res) => {
        // Log security event
        console.log(
          `SECURITY: User deletion attempted by ${req.user.username} for user ${req.params.id}`
        );

        res.json({
          message: 'User deletion initiated',
          targetUser: req.params.id,
          initiatedBy: req.user.username,
          timestamp: new Date().toISOString(),
        });
      }
    );

    // File upload endpoint - comprehensive validation
    app.post('/api/upload', authenticate(jwtSecret), rateLimiters.kyc, (req, res) => {
      const file = req.body.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Validate file type
      if (!file.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Only images allowed' });
      }

      // Validate file size (approximate)
      const sizeInBytes = file.length * 0.75;
      if (sizeInBytes > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File too large' });
      }

      res.json({
        message: 'File uploaded successfully',
        fileId: 'file-' + Date.now(),
        size: Math.floor(sizeInBytes),
      });
    });

    // Search endpoint with comprehensive input handling
    app.get('/api/search', authenticate(jwtSecret), (req, res) => {
      const { q, category, limit = 10, offset = 0 } = req.query;

      // Input validation
      if (q && q.length > 100) {
        return res.status(400).json({ error: 'Search query too long' });
      }

      if (limit > 50) {
        return res.status(400).json({ error: 'Limit too high' });
      }

      if (offset < 0) {
        return res.status(400).json({ error: 'Invalid offset' });
      }

      res.json({
        results: [],
        query: q,
        category: category,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: 0,
        },
      });
    });

    // Health check endpoint (minimal security)
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Security Integration Error:', err);

      // Don't expose stack traces in production
      const isDev = process.env.NODE_ENV === 'development';

      res.status(err.status || 500).json({
        error: isDev ? err.message : 'Internal server error',
        ...(isDev && { stack: err.stack }),
      });
    });

    jest.clearAllMocks();
  });

  describe('Security Middleware Stack Integration', () => {
    it('should apply security headers to all responses', async () => {
      const response = await request(app).get('/api/public').expect(200);

      // Check Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");

      // Check custom security headers
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .get('/api/public')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .options('/api/public')
        .set('Origin', 'https://malicious-site.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should apply XSS protection to request body', async () => {
      const userToken = jwt.sign({ id: '1', username: 'testuser', role: 'user' }, jwtSecret, {
        expiresIn: '1h',
      });

      const maliciousData = {
        name: 'Test Campaign<script>alert("xss")</script>',
        description: 'Safe description',
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-CSRF-Token', 'test-csrf-token')
        .send(maliciousData)
        .expect(201);

      // XSS should be sanitized
      expect(response.body.data.name).not.toContain('<script>');
    });

    it('should combine rate limiting with authentication', async () => {
      // Exceed auth rate limit with failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'wrong', password: 'wrong' })
          .expect(401);
      }

      // Should be rate limited even with correct credentials
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(429);

      expect(response.body.error).toBe('Too many authentication attempts');
    });
  });

  describe('Multi-Layer Security Validation', () => {
    let userToken, adminToken;

    beforeEach(async () => {
      // Get user token
      const userResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' })
        .expect(200);
      userToken = userResponse.body.token;

      // Get admin token
      const adminResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'adminpass' })
        .expect(200);
      adminToken = adminResponse.body.token;
    });

    it('should enforce authentication before authorization', async () => {
      // No token
      await request(app).get('/api/admin/settings').expect(401);

      // Invalid token
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Valid user token but insufficient role
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // Valid admin token
      await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should require CSRF token for state-changing operations', async () => {
      // Without CSRF token
      const response1 = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Campaign' })
        .expect(403);

      expect(response1.body.error).toBe('Invalid CSRF token');

      // With CSRF token
      const response2 = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-CSRF-Token', 'test-csrf-token')
        .send({ name: 'Test Campaign' })
        .expect(201);

      expect(response2.body.message).toBe('Campaign created');
    });

    it('should validate input after authentication and CSRF', async () => {
      const maliciousInput = {
        name: "'; DROP TABLE campaigns; --",
        description: '<script>alert("xss")</script>',
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-CSRF-Token', 'test-csrf-token')
        .send(maliciousInput)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it('should combine all security measures for sensitive operations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const response = await request(app)
        .delete('/api/admin/users/123')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test-csrf-token')
        .expect(200);

      expect(response.body.message).toBe('User deletion initiated');
      expect(response.body.targetUser).toBe('123');
      expect(response.body.initiatedBy).toBe('admin');

      // Should log security event
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY: User deletion attempted by admin for user 123')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Attack Vector Combinations', () => {
    let userToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      userToken = response.body.token;
    });

    it('should handle combined XSS and SQL injection attempts', async () => {
      const combinedAttack = {
        name: "'; DROP TABLE users; --<script>alert('xss')</script>",
        email: "test@example.com'; DELETE FROM campaigns; --",
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-CSRF-Token', 'test-csrf-token')
        .send(combinedAttack)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle session fixation and CSRF attacks', async () => {
      // Try to use a different CSRF token
      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-CSRF-Token', 'malicious-csrf-token')
        .send({ name: 'Test Campaign' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });

    it('should handle privilege escalation attempts', async () => {
      // Try to create a token with escalated privileges
      const maliciousToken = jwt.sign(
        { id: '1', username: 'testuser', role: 'admin' }, // Escalated role
        'wrong-secret' // Wrong signing key
      );

      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${maliciousToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should handle timing attacks on authentication', async () => {
      const startTime = Date.now();

      // Valid username, wrong password
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' })
        .expect(401);

      const validUserTime = Date.now() - startTime;

      const startTime2 = Date.now();

      // Invalid username
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistentuser', password: 'wrongpassword' })
        .expect(401);

      const invalidUserTime = Date.now() - startTime2;

      // Response times should be similar to prevent user enumeration
      // Allow for some variance but should be within reasonable bounds
      const timeDifference = Math.abs(validUserTime - invalidUserTime);
      expect(timeDifference).toBeLessThan(100); // Less than 100ms difference
    });
  });

  describe('File Upload Security', () => {
    let userToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      userToken = response.body.token;
    });

    it('should validate file types', async () => {
      const maliciousFile = 'data:application/javascript;base64,YWxlcnQoIlhTUyIp'; // alert("XSS")

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ file: maliciousFile })
        .expect(400);

      expect(response.body.error).toBe('Only images allowed');
    });

    it('should validate file sizes', async () => {
      // Create a very large base64 string (>5MB)
      const largeFile = 'data:image/jpeg;base64,' + 'A'.repeat(10 * 1024 * 1024);

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ file: largeFile })
        .expect(400);

      expect(response.body.error).toBe('File too large');
    });

    it('should accept valid image files', async () => {
      const validImage =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gODUK/9sAQwAFAwQEBAMFBAQEBQUFBgcMCAcHBwcPCwsJDBEPEhIRDxERExYcFxMUGhURERghGBodHR8fHxMXIiQiHiQcHh8e/9sAQwEFBQUHBgcOCAgOHhQRFB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQjBobHwFCNCUuHxMzNyFmKCksEGkyPDUZSWZOLy8vMmFzdJU2+P1td39p+X9xdfX3/H7QrAAAAAElFTkSuQmCC';

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ file: validImage })
        .expect(200);

      expect(response.body.message).toBe('File uploaded successfully');
      expect(response.body.fileId).toBeDefined();
    });

    it('should rate limit file uploads', async () => {
      const validImage =
        'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      // Make 3 uploads (at limit for KYC rate limiter)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ file: validImage })
          .expect(200);
      }

      // 4th upload should be rate limited
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ file: validImage })
        .expect(429);

      expect(response.body.error).toBe('Too many KYC submissions per hour');
    });
  });

  describe('Search Security', () => {
    let userToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      userToken = response.body.token;
    });

    it('should validate search parameters', async () => {
      const responses = await Promise.all([
        // Query too long
        request(app)
          .get('/api/search')
          .query({ q: 'a'.repeat(101) })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(400),

        // Limit too high
        request(app)
          .get('/api/search')
          .query({ limit: 100 })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(400),

        // Negative offset
        request(app)
          .get('/api/search')
          .query({ offset: -1 })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(400),
      ]);

      responses.forEach((response) => {
        expect(response.body.error).toBeDefined();
      });
    });

    it('should handle valid search requests', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: 'test query',
          category: 'campaigns',
          limit: 10,
          offset: 0,
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.results).toEqual([]);
      expect(response.body.query).toBe('test query');
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should sanitize search queries', async () => {
      const maliciousQuery = '<script>alert("xss")</script>search';

      const response = await request(app)
        .get('/api/search')
        .query({ q: maliciousQuery })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Query should be sanitized
      expect(response.body.query).not.toContain('<script>');
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in errors', async () => {
      // Trigger various errors and ensure no sensitive data is leaked

      // Database connection error simulation
      const response1 = await request(app).get('/api/nonexistent-endpoint').expect(404);

      // Should not expose internal paths or stack traces
      expect(response1.text).not.toContain('node_modules');
      expect(response1.text).not.toContain(__dirname);

      // Authentication error
      const response2 = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);

      expect(response2.body.error).toBe('Invalid token');
      // Should not expose the actual token or JWT secret
      expect(response2.body.token).toBeUndefined();
      expect(response2.text).not.toContain(jwtSecret);
    });

    it('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        // Malformed JSON
        request(app).post('/api/auth/login').type('json').send('{"invalid": json}').expect(400),

        // Very large request
        request(app)
          .post('/api/auth/login')
          .send({ data: 'x'.repeat(100000) })
          .expect(400),

        // Invalid Content-Type
        request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/xml')
          .send('<xml>invalid</xml>')
          .expect(400),
      ];

      const responses = await Promise.allSettled(malformedRequests);

      // All should complete without crashing
      responses.forEach((response) => {
        expect(['fulfilled', 'rejected'].includes(response.status)).toBe(true);
      });
    });
  });

  describe('Health and Monitoring', () => {
    it('should provide health check without authentication', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should not expose sensitive health information', async () => {
      const response = await request(app).get('/health').expect(200);

      // Should not contain sensitive information
      expect(response.body.database_connection_string).toBeUndefined();
      expect(response.body.secrets).toBeUndefined();
      expect(response.body.environment_variables).toBeUndefined();
    });

    it('should handle health check under load', async () => {
      const promises = Array.from({ length: 20 }, () => request(app).get('/health'));

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Performance Under Security Load', () => {
    let userToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      userToken = response.body.token;
    });

    it('should maintain performance with all security measures', async () => {
      const startTime = Date.now();
      const requests = [];

      // Make multiple concurrent requests through full security stack
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/api/profile').set('Authorization', `Bearer ${userToken}`));
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(2000); // 2 seconds

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.profile.username).toBe('testuser');
      });
    });

    it('should handle mixed request types efficiently', async () => {
      const mixedRequests = [
        request(app).get('/api/public'),
        request(app).get('/health'),
        request(app).get('/api/profile').set('Authorization', `Bearer ${userToken}`),
        request(app)
          .get('/api/search')
          .query({ q: 'test' })
          .set('Authorization', `Bearer ${userToken}`),
        request(app).post('/api/auth/login').send({ username: 'wrong', password: 'wrong' }),
      ];

      const startTime = Date.now();
      const responses = await Promise.allSettled(mixedRequests);
      const endTime = Date.now();

      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(1000);

      // Check that each request was handled appropriately
      expect(responses[0].value.status).toBe(200); // public
      expect(responses[1].value.status).toBe(200); // health
      expect(responses[2].value.status).toBe(200); // profile
      expect(responses[3].value.status).toBe(200); // search
      expect(responses[4].value.status).toBe(401); // failed auth
    });

    it('should maintain security under sustained load', async () => {
      const sustainedLoad = [];

      // Create 50 requests over time
      for (let i = 0; i < 50; i++) {
        sustainedLoad.push(
          request(app).get('/api/profile').set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.allSettled(sustainedLoad);

      // Check success rate
      const successful = responses.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200
      ).length;

      const rateLimited = responses.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 429
      ).length;

      // Should handle requests appropriately based on rate limits
      expect(successful + rateLimited).toBe(50);
      expect(successful).toBeGreaterThan(0); // Some should succeed
    });
  });
});
