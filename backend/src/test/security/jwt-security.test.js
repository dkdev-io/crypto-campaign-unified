import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../../middleware/security.js';
import { TestHelpers } from '../utils/testHelpers.js';

// Mock bcrypt for password testing
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password, rounds) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(password === hash.replace('hashed_', '')))
}));

describe('JWT and Session Management Security Tests', () => {
  let app;
  const jwtSecret = 'test-secret-key-for-testing';
  const expiredSecret = 'expired-secret';

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock user database
    const users = [
      {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password123',
        role: 'user',
        active: true
      },
      {
        id: '2',
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed_adminpass',
        role: 'admin',
        active: true
      },
      {
        id: '3',
        username: 'inactive',
        email: 'inactive@example.com',
        password: 'hashed_password',
        role: 'user',
        active: false
      }
    ];

    // Login endpoint
    app.post('/auth/login', async (req, res) => {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = users.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.active) {
        return res.status(401).json({ error: 'Account deactivated' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
        },
        jwtSecret
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    });

    // Token refresh endpoint
    app.post('/auth/refresh', authenticate(jwtSecret), (req, res) => {
      const user = users.find(u => u.id === req.user.id);
      if (!user || !user.active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const newToken = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60)
        },
        jwtSecret
      );

      res.json({ token: newToken });
    });

    // Password change endpoint
    app.post('/auth/change-password', authenticate(jwtSecret), async (req, res) => {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
      }

      const user = users.find(u => u.id === req.user.id);
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }

      // Password strength check
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      res.json({ message: 'Password changed successfully' });
    });

    // Protected user endpoint
    app.get('/api/profile', authenticate(jwtSecret), (req, res) => {
      const user = users.find(u => u.id === req.user.id);
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    });

    // Admin-only endpoint
    app.get('/api/admin/users', authenticate(jwtSecret), authorize('admin'), (req, res) => {
      res.json({
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          active: u.active
        }))
      });
    });

    // Multi-role endpoint
    app.get('/api/reports', authenticate(jwtSecret), (req, res, next) => {
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    }, (req, res) => {
      res.json({ reports: ['report1', 'report2'] });
    });

    // Endpoint with token in different locations
    app.get('/api/token-locations', (req, res) => {
      let token = null;
      
      // Check Authorization header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      }
      // Check query parameter
      else if (req.query.token) {
        token = req.query.token;
      }
      // Check cookies
      else if (req.cookies?.authToken) {
        token = req.cookies.authToken;
      }

      if (!token) {
        return res.status(401).json({ error: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, jwtSecret);
        res.json({ message: 'Token valid', user: decoded });
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    });

    jest.clearAllMocks();
  });

  describe('JWT Authentication Tests', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('user');

      // Verify token structure
      const decoded = jwt.decode(response.body.token);
      expect(decoded.id).toBe('1');
      expect(decoded.username).toBe('testuser');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.token).toBeUndefined();
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'inactive',
          password: 'password'
        })
        .expect(401);

      expect(response.body.error).toBe('Account deactivated');
    });

    it('should require both username and password', async () => {
      let response = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body.error).toBe('Username and password required');

      response = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.error).toBe('Username and password required');
    });
  });

  describe('Token Validation Tests', () => {
    let validToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      validToken = loginResponse.body.token;
    });

    it('should access protected endpoint with valid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.error).toBe('No authorization header provided');
      expect(response.body.code).toBe('AUTH_HEADER_MISSING');
    });

    it('should reject access with malformed authorization header', async () => {
      const malformedHeaders = [
        'Invalid token-format',
        'Bearer',
        'Bearer ',
        'Basic dGVzdDp0ZXN0', // Basic auth instead of Bearer
        validToken // Token without Bearer prefix
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/api/profile')
          .set('Authorization', header)
          .expect(401);

        expect(['No authorization header provided', 'Invalid authorization header format', 'No token provided'].includes(response.body.error)).toBe(true);
      }
    });

    it('should reject access with invalid token', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        validToken + 'tampered',
        validToken.substring(0, validToken.length - 10) // Truncated token
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
        expect(response.body.code).toBe('TOKEN_INVALID');
      }
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        {
          id: '1',
          username: 'testuser',
          role: 'user',
          exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
        },
        jwtSecret
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBe('Token expired');
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject tokens signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        {
          id: '1',
          username: 'testuser',
          role: 'user',
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        'wrong-secret-key'
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Role-Based Authorization Tests', () => {
    let userToken, adminToken;

    beforeEach(async () => {
      // Get user token
      const userResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      userToken = userResponse.body.token;

      // Get admin token
      const adminResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'adminpass' });
      adminToken = adminResponse.body.token;
    });

    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toHaveLength(3);
      expect(response.body.users[0].username).toBe('testuser');
    });

    it('should deny user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should handle multi-role authorization', async () => {
      // Create manager token
      const managerToken = jwt.sign(
        {
          id: '4',
          username: 'manager',
          role: 'manager',
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        jwtSecret
      );

      // Admin should have access
      await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Manager should have access
      await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // Regular user should be denied
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle role privilege escalation attempts', async () => {
      // Try to tamper with token payload
      const tamperedPayload = {
        id: '1',
        username: 'testuser',
        role: 'admin', // Escalated role
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const tamperedToken = jwt.sign(tamperedPayload, 'wrong-secret');

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Token Refresh and Session Management', () => {
    let validToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      validToken = loginResponse.body.token;
    });

    it('should refresh valid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(validToken); // Should be different token

      // Verify new token is valid
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${response.body.token}`)
        .expect(200);

      expect(profileResponse.body.username).toBe('testuser');
    });

    it('should reject refresh for inactive user', async () => {
      // Create token for inactive user
      const inactiveToken = jwt.sign(
        {
          id: '3',
          username: 'inactive',
          role: 'user',
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        jwtSecret
      );

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(401);

      expect(response.body.error).toBe('User not found or inactive');
    });

    it('should require valid token for refresh', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Password Security Tests', () => {
    let validToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      validToken = loginResponse.body.token;
    });

    it('should change password with valid current password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newSecurePassword123!'
        })
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newSecurePassword123!'
        })
        .expect(401);

      expect(response.body.error).toBe('Current password incorrect');
    });

    it('should enforce password strength requirements', async () => {
      const weakPasswords = [
        'short',
        '1234567',
        'weakpass'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/auth/change-password')
          .set('Authorization', `Bearer ${validToken}`)
          .send({
            currentPassword: 'password123',
            newPassword: password
          })
          .expect(400);

        expect(response.body.error).toBe('Password must be at least 8 characters');
      }
    });

    it('should require both current and new password', async () => {
      let response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'password123' })
        .expect(400);

      expect(response.body.error).toBe('Current and new password required');

      response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ newPassword: 'newPassword123!' })
        .expect(400);

      expect(response.body.error).toBe('Current and new password required');
    });

    it('should require authentication for password change', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123!'
        })
        .expect(401);

      expect(response.body.error).toBe('No authorization header provided');
    });
  });

  describe('Token Location and Format Tests', () => {
    let validToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      validToken = loginResponse.body.token;
    });

    it('should accept token in Authorization header', async () => {
      const response = await request(app)
        .get('/api/token-locations')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Token valid');
    });

    it('should accept token in query parameter', async () => {
      const response = await request(app)
        .get('/api/token-locations')
        .query({ token: validToken })
        .expect(200);

      expect(response.body.message).toBe('Token valid');
    });

    it('should prioritize Authorization header over query parameter', async () => {
      const invalidToken = 'invalid-token';
      
      const response = await request(app)
        .get('/api/token-locations')
        .set('Authorization', `Bearer ${validToken}`)
        .query({ token: invalidToken })
        .expect(200);

      expect(response.body.message).toBe('Token valid');
    });

    it('should reject requests without any token', async () => {
      const response = await request(app)
        .get('/api/token-locations')
        .expect(401);

      expect(response.body.error).toBe('Token required');
    });
  });

  describe('Security Attack Simulation', () => {
    let validToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      validToken = loginResponse.body.token;
    });

    it('should prevent JWT algorithm confusion attacks', async () => {
      // Create token with 'none' algorithm
      const noneAlgToken = jwt.sign(
        { id: '1', username: 'testuser', role: 'admin' },
        '',
        { algorithm: 'none' }
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${noneAlgToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should prevent token reuse after user deactivation', async () => {
      // Simulate user deactivation by modifying user status
      // This would normally be done through an admin endpoint

      const inactiveUserToken = jwt.sign(
        {
          id: '3', // inactive user
          username: 'inactive',
          role: 'user',
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        jwtSecret
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${inactiveUserToken}`)
        .expect(401);

      // This would require additional middleware to check user status
      // For now, the token validation itself doesn't check user status
    });

    it('should handle concurrent login attempts', async () => {
      const loginRequests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/auth/login')
          .send({ username: 'testuser', password: 'password123' })
      );

      const responses = await Promise.all(loginRequests);
      
      // All should succeed (no rate limiting implemented yet)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
      });

      // Each token should be unique
      const tokens = responses.map(r => r.body.token);
      const uniqueTokens = [...new Set(tokens)];
      expect(uniqueTokens.length).toBe(tokens.length);
    });

    it('should handle very long tokens', async () => {
      const longPayload = {
        id: '1',
        username: 'testuser',
        role: 'user',
        longField: 'a'.repeat(10000), // Very long field
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const longToken = jwt.sign(longPayload, jwtSecret);

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(200);

      expect(response.body.username).toBe('testuser');
    });

    it('should handle tokens with additional claims', async () => {
      const tokenWithClaims = jwt.sign(
        {
          id: '1',
          username: 'testuser',
          role: 'user',
          permissions: ['read', 'write'],
          department: 'engineering',
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        jwtSecret
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenWithClaims}`)
        .expect(200);

      expect(response.body.username).toBe('testuser');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JWT structure', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'only-one-part',
        'two.parts',
        'four.parts.are.invalid',
        '',
        null,
        undefined
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
      }
    });

    it('should handle JSON parsing errors in token payload', async () => {
      // Create token with invalid JSON in payload
      const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url');
      const payload = Buffer.from('invalid json').toString('base64url');
      const signature = 'invalid-signature';
      const malformedToken = `${header}.${payload}.${signature}`;

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${malformedToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should handle missing required claims', async () => {
      const tokenWithoutId = jwt.sign(
        {
          username: 'testuser',
          role: 'user',
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        jwtSecret
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenWithoutId}`)
        .expect(500); // Server error due to missing user.id

      expect(response.body.error).toBe('Authentication error');
    });

    it('should handle system clock skew', async () => {
      // Token issued in the future
      const futureToken = jwt.sign(
        {
          id: '1',
          username: 'testuser',
          role: 'user',
          iat: Math.floor(Date.now() / 1000) + 3600, // Issued 1 hour in the future
          exp: Math.floor(Date.now() / 1000) + 7200  // Expires 2 hours in the future
        },
        jwtSecret
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${futureToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });
});