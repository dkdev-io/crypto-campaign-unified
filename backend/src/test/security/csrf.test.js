import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { csrfProtection } from '../../middleware/security.js';
import { TestHelpers } from '../utils/testHelpers.js';

describe('CSRF Protection Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Setup session middleware for CSRF token storage
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // For testing
      })
    );

    // Endpoint to generate CSRF token
    app.get('/csrf-token', (req, res) => {
      req.session.csrfToken = 'test-csrf-token-' + Date.now();
      res.json({ csrfToken: req.session.csrfToken });
    });

    // Protected endpoints
    app.use('/api', csrfProtection);

    app.post('/api/test', (req, res) => {
      res.json({ message: 'Success', data: req.body });
    });

    app.put('/api/test/:id', (req, res) => {
      res.json({ message: 'Updated', id: req.params.id, data: req.body });
    });

    app.delete('/api/test/:id', (req, res) => {
      res.json({ message: 'Deleted', id: req.params.id });
    });

    // Unprotected GET endpoint
    app.get('/api/test', (req, res) => {
      res.json({ message: 'GET requests are allowed' });
    });
  });

  describe('CSRF Token Validation', () => {
    it('should allow GET requests without CSRF token', async () => {
      const response = await request(app).get('/api/test').expect(200);

      expect(response.body.message).toBe('GET requests are allowed');
    });

    it('should allow HEAD requests without CSRF token', async () => {
      await request(app).head('/api/test').expect(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      await request(app).options('/api/test').expect(200);
    });

    it('should reject POST request without CSRF token', async () => {
      const response = await request(app).post('/api/test').send({ data: 'test' }).expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should reject PUT request without CSRF token', async () => {
      const response = await request(app).put('/api/test/1').send({ data: 'test' }).expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should reject DELETE request without CSRF token', async () => {
      const response = await request(app).delete('/api/test/1').expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
      expect(response.body.code).toBe('CSRF_INVALID');
    });
  });

  describe('Valid CSRF Token Tests', () => {
    let agent;
    let csrfToken;

    beforeEach(async () => {
      agent = request.agent(app);

      // Get CSRF token
      const tokenResponse = await agent.get('/csrf-token').expect(200);

      csrfToken = tokenResponse.body.csrfToken;
    });

    it('should allow POST request with valid CSRF token in header', async () => {
      const response = await agent
        .post('/api/test')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test data' })
        .expect(200);

      expect(response.body.message).toBe('Success');
      expect(response.body.data.data).toBe('test data');
    });

    it('should allow POST request with valid CSRF token in body', async () => {
      const response = await agent
        .post('/api/test')
        .send({
          data: 'test data',
          _csrf: csrfToken,
        })
        .expect(200);

      expect(response.body.message).toBe('Success');
      expect(response.body.data.data).toBe('test data');
    });

    it('should allow PUT request with valid CSRF token', async () => {
      const response = await agent
        .put('/api/test/123')
        .set('X-CSRF-Token', csrfToken)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.message).toBe('Updated');
      expect(response.body.id).toBe('123');
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should allow DELETE request with valid CSRF token', async () => {
      const response = await agent
        .delete('/api/test/456')
        .set('X-CSRF-Token', csrfToken)
        .expect(200);

      expect(response.body.message).toBe('Deleted');
      expect(response.body.id).toBe('456');
    });
  });

  describe('Invalid CSRF Token Tests', () => {
    let agent;

    beforeEach(async () => {
      agent = request.agent(app);

      // Get CSRF token but don't use it
      await agent.get('/csrf-token').expect(200);
    });

    it('should reject request with wrong CSRF token', async () => {
      const response = await agent
        .post('/api/test')
        .set('X-CSRF-Token', 'wrong-token')
        .send({ data: 'test data' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should reject request with empty CSRF token', async () => {
      const response = await agent
        .post('/api/test')
        .set('X-CSRF-Token', '')
        .send({ data: 'test data' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
      expect(response.body.code).toBe('CSRF_INVALID');
    });

    it('should reject request with malformed CSRF token', async () => {
      const malformedTokens = ['malformed-token', null, undefined, 123, {}, []];

      for (const token of malformedTokens) {
        const response = await agent
          .post('/api/test')
          .set('X-CSRF-Token', token)
          .send({ data: 'test data' })
          .expect(403);

        expect(response.body.error).toBe('Invalid CSRF token');
      }
    });
  });

  describe('Session-based CSRF Tests', () => {
    it('should reject request when session has no CSRF token', async () => {
      const agent = request.agent(app);

      // Don't get CSRF token, send request directly
      const response = await agent
        .post('/api/test')
        .set('X-CSRF-Token', 'any-token')
        .send({ data: 'test data' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });

    it('should handle session destruction gracefully', async () => {
      const agent = request.agent(app);

      // Get CSRF token
      const tokenResponse = await agent.get('/csrf-token').expect(200);

      const csrfToken = tokenResponse.body.csrfToken;

      // Destroy session endpoint
      app.post('/destroy-session', (req, res) => {
        req.session.destroy();
        res.json({ message: 'Session destroyed' });
      });

      // Destroy session
      await agent.post('/destroy-session').expect(200);

      // Try to use old CSRF token
      const response = await agent
        .post('/api/test')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test data' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });
  });

  describe('Double Submit Cookie Pattern', () => {
    beforeEach(() => {
      // Add alternative CSRF protection using double submit cookies
      app.use('/api/alt', (req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        const tokenFromHeader = req.headers['x-csrf-token'];
        const tokenFromCookie = req.cookies?.csrfToken;

        if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
          return res.status(403).json({
            error: 'Invalid CSRF token',
            code: 'CSRF_INVALID',
          });
        }

        next();
      });

      app.post('/api/alt/test', (req, res) => {
        res.json({ message: 'Alternative CSRF protection works' });
      });
    });

    it('should work with double submit cookie pattern', async () => {
      const agent = request.agent(app);
      const token = 'test-cookie-token';

      // Set cookie first
      app.get('/set-csrf-cookie', (req, res) => {
        res.cookie('csrfToken', token, { httpOnly: false });
        res.json({ token });
      });

      await agent.get('/set-csrf-cookie').expect(200);

      const response = await agent
        .post('/api/alt/test')
        .set('X-CSRF-Token', token)
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.message).toBe('Alternative CSRF protection works');
    });
  });

  describe('Attack Vector Tests', () => {
    it('should prevent CSRF attack via form submission', async () => {
      // Simulate attacker's form trying to submit to protected endpoint
      const response = await request(app)
        .post('/api/test')
        .type('form')
        .send('data=malicious_data&amount=1000000')
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });

    it('should prevent CSRF attack via AJAX without proper token', async () => {
      // Simulate attacker's AJAX request
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send({
          action: 'transfer',
          amount: 1000000,
          destination: 'attacker-account',
        })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });

    it('should prevent CSRF attack with forged referrer', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Referer', 'https://legitimate-site.com')
        .set('Origin', 'https://legitimate-site.com')
        .send({ malicious: 'data' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing session middleware gracefully', async () => {
      const appWithoutSession = express();
      appWithoutSession.use(express.json());
      appWithoutSession.use('/api', csrfProtection);
      appWithoutSession.post('/api/test', (req, res) => {
        res.json({ message: 'Success' });
      });

      const response = await request(appWithoutSession)
        .post('/api/test')
        .set('X-CSRF-Token', 'any-token')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('Invalid CSRF token');
    });

    it('should handle concurrent requests with same token', async () => {
      const agent = request.agent(app);

      const tokenResponse = await agent.get('/csrf-token').expect(200);
      const csrfToken = tokenResponse.body.csrfToken;

      // Send multiple concurrent requests with same token
      const promises = Array.from({ length: 5 }, () =>
        agent.post('/api/test').set('X-CSRF-Token', csrfToken).send({ data: 'concurrent test' })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Success');
      });
    });

    it('should handle very long CSRF tokens', async () => {
      const agent = request.agent(app);
      const longToken = 'a'.repeat(10000);

      // Manually set session token
      app.get('/set-long-token', (req, res) => {
        req.session.csrfToken = longToken;
        res.json({ token: longToken });
      });

      await agent.get('/set-long-token').expect(200);

      const response = await agent
        .post('/api/test')
        .set('X-CSRF-Token', longToken)
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.message).toBe('Success');
    });
  });

  describe('Content-Type Specific Tests', () => {
    let agent;
    let csrfToken;

    beforeEach(async () => {
      agent = request.agent(app);
      const tokenResponse = await agent.get('/csrf-token').expect(200);
      csrfToken = tokenResponse.body.csrfToken;
    });

    it('should handle multipart/form-data requests', async () => {
      const response = await agent
        .post('/api/test')
        .field('_csrf', csrfToken)
        .field('data', 'test data')
        .field('file', 'file content')
        .expect(200);

      expect(response.body.message).toBe('Success');
    });

    it('should handle application/x-www-form-urlencoded', async () => {
      const response = await agent
        .post('/api/test')
        .type('form')
        .send(`_csrf=${csrfToken}&data=test+data&number=123`)
        .expect(200);

      expect(response.body.message).toBe('Success');
    });
  });
});
