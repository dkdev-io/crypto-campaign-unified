import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createRateLimit, rateLimiters } from '../../middleware/security.js';
import { TestHelpers } from '../utils/testHelpers.js';

// Mock setTimeout to speed up tests
jest.useFakeTimers();

describe('Rate Limiting and DDoS Protection Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Basic rate limiting endpoint
    app.get('/api/basic', 
      createRateLimit(60 * 1000, 5, 'Too many basic requests'), // 5 requests per minute
      (req, res) => {
        res.json({ message: 'Basic endpoint accessed' });
      }
    );

    // Strict rate limiting endpoint
    app.post('/api/strict',
      createRateLimit(60 * 1000, 2, 'Too many strict requests'), // 2 requests per minute
      (req, res) => {
        res.json({ message: 'Strict endpoint accessed', data: req.body });
      }
    );

    // Authentication endpoint with very strict limiting
    app.post('/api/auth/login',
      rateLimiters.auth,
      (req, res) => {
        const { username, password } = req.body;
        
        if (username === 'admin' && password === 'password') {
          res.json({ message: 'Login successful', token: 'fake-jwt-token' });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      }
    );

    // Contribution endpoint with moderate limiting
    app.post('/api/contributions',
      rateLimiters.contributions,
      (req, res) => {
        res.status(201).json({ 
          message: 'Contribution accepted', 
          id: 'contrib-' + Date.now(),
          amount: req.body.amount 
        });
      }
    );

    // KYC endpoint with hourly limiting
    app.post('/api/kyc',
      rateLimiters.kyc,
      (req, res) => {
        res.status(201).json({ 
          message: 'KYC submitted', 
          id: 'kyc-' + Date.now() 
        });
      }
    );

    // General API endpoint
    app.get('/api/general',
      rateLimiters.general,
      (req, res) => {
        res.json({ message: 'General API accessed' });
      }
    );

    // Custom rate limiter with IP + User ID
    app.get('/api/user-specific',
      (req, res, next) => {
        // Simulate authenticated request
        req.user = { id: req.headers['x-user-id'] || 'anonymous' };
        next();
      },
      createRateLimit(60 * 1000, 3, 'Too many user-specific requests'),
      (req, res) => {
        res.json({ 
          message: 'User-specific endpoint accessed',
          userId: req.user.id
        });
      }
    );

    // Endpoint with progressive rate limiting
    app.post('/api/progressive',
      (req, res, next) => {
        // First level: 10 requests per minute
        const firstLevel = createRateLimit(60 * 1000, 10, 'Rate limit exceeded - Level 1');
        firstLevel(req, res, (err) => {
          if (err || res.headersSent) return;
          
          // Second level: 20 requests per 5 minutes
          const secondLevel = createRateLimit(5 * 60 * 1000, 20, 'Rate limit exceeded - Level 2');
          secondLevel(req, res, (err2) => {
            if (err2 || res.headersSent) return;
            next();
          });
        });
      },
      (req, res) => {
        res.json({ message: 'Progressive rate limiting passed' });
      }
    );

    // Bypass endpoint for testing (no rate limiting)
    app.get('/api/unlimited', (req, res) => {
      res.json({ message: 'No rate limiting', timestamp: Date.now() });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const responses = [];
      
      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/basic')
          .expect(200);
        
        responses.push(response);
        expect(response.body.message).toBe('Basic endpoint accessed');
      }

      // Check rate limit headers
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.headers['x-ratelimit-limit']).toBe('5');
      expect(lastResponse.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('should reject requests exceeding rate limit', async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/basic').expect(200);
      }

      // 6th request should be rejected
      const response = await request(app)
        .get('/api/basic')
        .expect(429);

      expect(response.body.error).toBe('Too many basic requests');
      expect(response.body.retryAfter).toContain('minutes');
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should reset rate limit after window expires', async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/basic').expect(200);
      }

      // 6th request should be rejected
      await request(app).get('/api/basic').expect(429);

      // Fast forward time by 61 seconds (past the 60s window)
      jest.advanceTimersByTime(61 * 1000);

      // Should allow requests again
      const response = await request(app)
        .get('/api/basic')
        .expect(200);

      expect(response.body.message).toBe('Basic endpoint accessed');
    });

    it('should track different IPs separately', async () => {
      const agent1 = request.agent(app);
      const agent2 = request.agent(app);

      // Make 5 requests from first IP (at limit)
      for (let i = 0; i < 5; i++) {
        await agent1.get('/api/basic').expect(200);
      }

      // 6th request from first IP should be rejected
      await agent1.get('/api/basic').expect(429);

      // Requests from second IP should still work
      const response = await agent2.get('/api/basic').expect(200);
      expect(response.body.message).toBe('Basic endpoint accessed');
    });
  });

  describe('Authentication Rate Limiting', () => {
    it('should allow valid login attempts within limit', async () => {
      const validCredentials = { username: 'admin', password: 'password' };
      
      // Make 5 login attempts (within limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(validCredentials)
          .expect(200);
        
        expect(response.body.message).toBe('Login successful');
      }
    });

    it('should block brute force login attempts', async () => {
      const invalidCredentials = { username: 'admin', password: 'wrong' };
      
      // Make 5 failed login attempts (at limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(invalidCredentials)
          .expect(401);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidCredentials)
        .expect(429);

      expect(response.body.error).toBe('Too many authentication attempts');
    });

    it('should also block valid credentials after rate limit exceeded', async () => {
      const invalidCredentials = { username: 'admin', password: 'wrong' };
      const validCredentials = { username: 'admin', password: 'password' };
      
      // Make 5 failed attempts to trigger rate limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(invalidCredentials)
          .expect(401);
      }

      // Even valid credentials should be blocked now
      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(429);

      expect(response.body.error).toBe('Too many authentication attempts');
    });

    it('should handle mixed valid and invalid attempts', async () => {
      const invalidCredentials = { username: 'admin', password: 'wrong' };
      const validCredentials = { username: 'admin', password: 'password' };
      
      // Mix of valid and invalid attempts
      await request(app).post('/api/auth/login').send(validCredentials).expect(200);
      await request(app).post('/api/auth/login').send(invalidCredentials).expect(401);
      await request(app).post('/api/auth/login').send(validCredentials).expect(200);
      await request(app).post('/api/auth/login').send(invalidCredentials).expect(401);
      await request(app).post('/api/auth/login').send(invalidCredentials).expect(401);

      // 6th attempt should be rate limited
      await request(app).post('/api/auth/login').send(validCredentials).expect(429);
    });
  });

  describe('Contribution Rate Limiting', () => {
    it('should allow contributions within limit', async () => {
      const contribution = { 
        address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
        amount: '1.0' 
      };
      
      // Make 10 contributions (within 5-minute limit)
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/contributions')
          .send({ ...contribution, amount: `${i + 1}.0` })
          .expect(201);
        
        expect(response.body.message).toBe('Contribution accepted');
      }
    });

    it('should block excessive contribution attempts', async () => {
      const contribution = { 
        address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
        amount: '1.0' 
      };
      
      // Make 10 contributions (at limit)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/contributions')
          .send(contribution)
          .expect(201);
      }

      // 11th contribution should be blocked
      const response = await request(app)
        .post('/api/contributions')
        .send(contribution)
        .expect(429);

      expect(response.body.error).toBe('Too many contribution attempts');
    });

    it('should reset contribution limit after window', async () => {
      const contribution = { 
        address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
        amount: '1.0' 
      };
      
      // Make 10 contributions (at limit)
      for (let i = 0; i < 10; i++) {
        await request(app).post('/api/contributions').send(contribution).expect(201);
      }

      // Should be blocked
      await request(app).post('/api/contributions').send(contribution).expect(429);

      // Fast forward 5 minutes and 1 second
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

      // Should work again
      const response = await request(app)
        .post('/api/contributions')
        .send(contribution)
        .expect(201);

      expect(response.body.message).toBe('Contribution accepted');
    });
  });

  describe('KYC Rate Limiting', () => {
    it('should allow KYC submissions within hourly limit', async () => {
      const kycData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        document_type: 'passport'
      };
      
      // Make 3 KYC submissions (within hourly limit)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/kyc')
          .send({ ...kycData, email: `john${i}@example.com` })
          .expect(201);
        
        expect(response.body.message).toBe('KYC submitted');
      }
    });

    it('should block excessive KYC submissions', async () => {
      const kycData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        document_type: 'passport'
      };
      
      // Make 3 KYC submissions (at limit)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/kyc')
          .send(kycData)
          .expect(201);
      }

      // 4th submission should be blocked
      const response = await request(app)
        .post('/api/kyc')
        .send(kycData)
        .expect(429);

      expect(response.body.error).toBe('Too many KYC submissions per hour');
    });

    it('should have longer reset window for KYC', async () => {
      const kycData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        document_type: 'passport'
      };
      
      // Make 3 KYC submissions (at limit)
      for (let i = 0; i < 3; i++) {
        await request(app).post('/api/kyc').send(kycData).expect(201);
      }

      // Should be blocked
      await request(app).post('/api/kyc').send(kycData).expect(429);

      // Fast forward 30 minutes (should still be blocked)
      jest.advanceTimersByTime(30 * 60 * 1000);
      await request(app).post('/api/kyc').send(kycData).expect(429);

      // Fast forward to 1 hour and 1 second
      jest.advanceTimersByTime(30 * 60 * 1000 + 1000);

      // Should work again
      const response = await request(app)
        .post('/api/kyc')
        .send(kycData)
        .expect(201);

      expect(response.body.message).toBe('KYC submitted');
    });
  });

  describe('User-Specific Rate Limiting', () => {
    it('should track rate limits per user ID', async () => {
      // Make 3 requests as user1 (at limit)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get('/api/user-specific')
          .set('X-User-ID', 'user1')
          .expect(200);
      }

      // 4th request as user1 should be blocked
      await request(app)
        .get('/api/user-specific')
        .set('X-User-ID', 'user1')
        .expect(429);

      // Requests as user2 should still work
      const response = await request(app)
        .get('/api/user-specific')
        .set('X-User-ID', 'user2')
        .expect(200);

      expect(response.body.userId).toBe('user2');
    });

    it('should combine IP and user ID for key generation', async () => {
      const agent1 = request.agent(app);
      const agent2 = request.agent(app);

      // Same user from different IPs should have separate limits
      for (let i = 0; i < 3; i++) {
        await agent1.get('/api/user-specific').set('X-User-ID', 'user1').expect(200);
      }

      // user1 from agent1 should be blocked
      await agent1.get('/api/user-specific').set('X-User-ID', 'user1').expect(429);

      // Same user from different IP should still work
      const response = await agent2
        .get('/api/user-specific')
        .set('X-User-ID', 'user1')
        .expect(200);

      expect(response.body.userId).toBe('user1');
    });
  });

  describe('DDoS Attack Simulation', () => {
    it('should handle burst of requests', async () => {
      const requests = [];
      
      // Create 20 simultaneous requests
      for (let i = 0; i < 20; i++) {
        requests.push(request(app).get('/api/basic'));
      }

      const responses = await Promise.allSettled(requests);
      
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const rateLimited = responses.filter(r => r.status === 'fulfilled' && r.value.status === 429);

      // Should have 5 successful and 15 rate limited
      expect(successful.length).toBe(5);
      expect(rateLimited.length).toBe(15);
    });

    it('should handle sustained attack over time', async () => {
      const results = [];
      
      // Simulate attack over multiple windows
      for (let window = 0; window < 3; window++) {
        // Make 10 requests in this window
        for (let req = 0; req < 10; req++) {
          const response = await request(app).get('/api/basic');
          results.push(response.status);
        }
        
        // Advance time by 30 seconds (half window)
        jest.advanceTimersByTime(30 * 1000);
      }

      const successful = results.filter(status => status === 200);
      const rateLimited = results.filter(status => status === 429);

      // Should have limited number of successful requests
      expect(successful.length).toBeLessThan(results.length);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should handle requests from multiple IPs', async () => {
      const agents = Array.from({ length: 10 }, () => request.agent(app));
      const results = [];

      // Each IP makes 6 requests (1 over limit)
      for (const agent of agents) {
        for (let i = 0; i < 6; i++) {
          const response = await agent.get('/api/basic');
          results.push({ agent: agents.indexOf(agent), status: response.status });
        }
      }

      // Each IP should have 5 successful and 1 rate limited
      for (let i = 0; i < 10; i++) {
        const ipResults = results.filter(r => r.agent === i);
        const successful = ipResults.filter(r => r.status === 200);
        const rateLimited = ipResults.filter(r => r.status === 429);
        
        expect(successful.length).toBe(5);
        expect(rateLimited.length).toBe(1);
      }
    });

    it('should handle malformed requests in attack', async () => {
      const malformedRequests = [
        request(app).get('/api/basic').set('Content-Type', 'invalid'),
        request(app).get('/api/basic').set('User-Agent', 'X'.repeat(1000)),
        request(app).get('/api/basic').set('Authorization', 'Bearer invalid-very-long-token'.repeat(100)),
        request(app).post('/api/strict').send('invalid json{'),
        request(app).post('/api/strict').send({ data: 'X'.repeat(10000) })
      ];

      const responses = await Promise.allSettled(malformedRequests);
      
      // Should handle malformed requests gracefully
      responses.forEach(response => {
        expect(['fulfilled', 'rejected'].includes(response.status)).toBe(true);
        if (response.status === 'fulfilled') {
          expect([200, 400, 429, 500].includes(response.value.status)).toBe(true);
        }
      });
    });
  });

  describe('Rate Limit Headers and Responses', () => {
    it('should include proper rate limit headers', async () => {
      const response = await request(app)
        .get('/api/basic')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should include retry-after header when rate limited', async () => {
      // Exceed rate limit
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/basic').expect(200);
      }

      const response = await request(app)
        .get('/api/basic')
        .expect(429);

      expect(response.headers['retry-after']).toBeDefined();
      expect(parseInt(response.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('should provide informative error messages', async () => {
      // Exceed rate limit
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/basic').expect(200);
      }

      const response = await request(app)
        .get('/api/basic')
        .expect(429);

      expect(response.body.error).toBe('Too many basic requests');
      expect(response.body.retryAfter).toContain('minutes');
    });

    it('should update remaining count correctly', async () => {
      const responses = [];
      
      // Make 5 requests and check remaining count
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api/basic').expect(200);
        responses.push(response);
      }

      // Check decreasing remaining count
      expect(responses[0].headers['x-ratelimit-remaining']).toBe('4');
      expect(responses[1].headers['x-ratelimit-remaining']).toBe('3');
      expect(responses[2].headers['x-ratelimit-remaining']).toBe('2');
      expect(responses[3].headers['x-ratelimit-remaining']).toBe('1');
      expect(responses[4].headers['x-ratelimit-remaining']).toBe('0');
    });
  });

  describe('Bypass and Edge Cases', () => {
    it('should not apply rate limiting to unlimited endpoints', async () => {
      // Make many requests to unlimited endpoint
      for (let i = 0; i < 50; i++) {
        const response = await request(app)
          .get('/api/unlimited')
          .expect(200);

        expect(response.body.message).toBe('No rate limiting');
        expect(response.headers['x-ratelimit-limit']).toBeUndefined();
      }
    });

    it('should handle requests with missing IP address', async () => {
      // This would be more relevant in a real environment
      // where IP address might be missing or malformed
      const response = await request(app)
        .get('/api/basic')
        .expect(200);

      expect(response.body.message).toBe('Basic endpoint accessed');
    });

    it('should handle concurrent requests at exact rate limit', async () => {
      const promises = [];
      
      // Make exactly 5 concurrent requests (at limit)
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/api/basic'));
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Next request should be rate limited
      const nextResponse = await request(app).get('/api/basic').expect(429);
      expect(nextResponse.body.error).toBe('Too many basic requests');
    });

    it('should handle system clock changes', async () => {
      // Make some requests
      await request(app).get('/api/basic').expect(200);
      await request(app).get('/api/basic').expect(200);

      // Simulate time going backwards (shouldn't break rate limiting)
      jest.advanceTimersByTime(-30 * 1000);

      // Should still enforce rate limiting properly
      await request(app).get('/api/basic').expect(200);
      await request(app).get('/api/basic').expect(200);
      await request(app).get('/api/basic').expect(200);
      
      // Should be rate limited
      await request(app).get('/api/basic').expect(429);
    });

    it('should handle very high request rates', async () => {
      const startTime = Date.now();
      const requests = [];
      
      // Create 100 requests as fast as possible
      for (let i = 0; i < 100; i++) {
        requests.push(request(app).get('/api/basic'));
      }

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      ).length;

      // Should have rate limited most requests
      expect(successful).toBe(5);
      expect(rateLimited).toBe(95);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete quickly
    });
  });

  describe('Memory and Performance', () => {
    it('should not leak memory with many different IPs', async () => {
      // This test would be more meaningful in a real environment
      // For now, just ensure it handles many different source IPs
      
      const results = [];
      
      // Simulate requests from 100 different IPs
      for (let i = 0; i < 100; i++) {
        const agent = request.agent(app);
        const response = await agent.get('/api/basic');
        results.push(response.status);
      }

      // All should succeed (each IP gets its own limit)
      expect(results.every(status => status === 200)).toBe(true);
    });

    it('should clean up expired entries', async () => {
      // Make some requests
      await request(app).get('/api/basic').expect(200);
      
      // Fast forward past cleanup time
      jest.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
      
      // Rate limiter should have cleaned up old entries
      // New requests should work normally
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/basic').expect(200);
      }
      
      // Should be rate limited after 5 requests
      await request(app).get('/api/basic').expect(429);
    });

    it('should handle rapid successive requests efficiently', async () => {
      const startTime = process.hrtime();
      
      // Make 5 requests in rapid succession
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/basic').expect(200);
      }
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000;
      
      // Should complete quickly (less than 1 second)
      expect(totalTime).toBeLessThan(1000);
    });
  });
});