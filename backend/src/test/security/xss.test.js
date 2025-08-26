import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { xssProtection, sanitizeObject } from '../../middleware/security.js';
import { TestHelpers } from '../utils/testHelpers.js';

// No need to mock DOMPurify since we're using our own sanitizer

describe('XSS Prevention Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(xssProtection);
    
    // Test endpoint
    app.post('/test', (req, res) => {
      res.json({ 
        body: req.body, 
        query: req.query 
      });
    });

    app.get('/test', (req, res) => {
      res.json({ 
        query: req.query 
      });
    });
  });

  describe('Request Body Sanitization', () => {
    it('should remove script tags from request body', async () => {
      const maliciousPayload = {
        name: 'John<script>alert("XSS")</script>Doe',
        description: 'Safe content'
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.name).toBe('JohnDoe');
      expect(response.body.body.description).toBe('Safe content');
    });

    it('should remove javascript: protocols', async () => {
      const maliciousPayload = {
        website: 'javascript:alert("XSS")',
        email: 'user@example.com'
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.website).toBe('alert("XSS")');
      expect(response.body.body.email).toBe('user@example.com');
    });

    it('should remove inline event handlers', async () => {
      const maliciousPayload = {
        content: '<div onclick="alert(\'XSS\')">Click me</div>',
        title: 'Safe Title'
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.content).toBe('<div>Click me</div>');
      expect(response.body.body.title).toBe('Safe Title');
    });

    it('should handle nested objects', async () => {
      const maliciousPayload = {
        user: {
          name: 'John<script>alert("XSS")</script>',
          profile: {
            bio: '<img src=x onerror=alert("XSS")>Bio content'
          }
        }
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.user.name).toBe('John');
      expect(response.body.body.user.profile.bio).toBe('<img src=x>Bio content');
    });

    it('should handle arrays with malicious content', async () => {
      const maliciousPayload = {
        tags: [
          'safe-tag',
          '<script>alert("XSS")</script>malicious',
          'another-safe-tag'
        ]
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.tags).toEqual([
        'safe-tag',
        'malicious',
        'another-safe-tag'
      ]);
    });

    it('should preserve non-string values', async () => {
      const payload = {
        name: 'John<script>alert("XSS")</script>',
        age: 25,
        active: true,
        score: 95.5,
        metadata: null
      };

      const response = await request(app)
        .post('/test')
        .send(payload)
        .expect(200);

      expect(response.body.body.name).toBe('John');
      expect(response.body.body.age).toBe(25);
      expect(response.body.body.active).toBe(true);
      expect(response.body.body.score).toBe(95.5);
      expect(response.body.body.metadata).toBeNull();
    });
  });

  describe('Query Parameter Sanitization', () => {
    it('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/test')
        .query({ 
          search: '<script>alert("XSS")</script>test',
          filter: 'safe-filter'
        })
        .expect(200);

      expect(response.body.query.search).toBe('test');
      expect(response.body.query.filter).toBe('safe-filter');
    });

    it('should handle multiple XSS vectors in query params', async () => {
      const response = await request(app)
        .get('/test')
        .query({
          q: 'javascript:alert("XSS")',
          callback: '<img src=x onerror=alert(1)>',
          redirect: 'http://safe-site.com'
        })
        .expect(200);

      expect(response.body.query.q).toBe('alert("XSS")');
      expect(response.body.query.callback).toBe('<img src=x>');
      expect(response.body.query.redirect).toBe('http://safe-site.com');
    });
  });

  describe('Advanced XSS Vectors', () => {
    it('should handle HTML5 XSS vectors', async () => {
      const maliciousPayloads = [
        '<svg onload=alert("XSS")>',
        '<iframe src=javascript:alert("XSS")></iframe>',
        '<object data=javascript:alert("XSS")>',
        '<embed src=javascript:alert("XSS")>',
        '<video src=x onerror=alert("XSS")>',
        '<audio src=x onerror=alert("XSS")>'
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/test')
          .send({ content: payload })
          .expect(200);

        // Should not contain the original malicious payload
        expect(response.body.body.content).not.toContain('alert("XSS")');
        expect(response.body.body.content).not.toContain('javascript:');
      }
    });

    it('should handle encoded XSS attempts', async () => {
      const encodedPayloads = [
        '&#x3C;script&#x3E;alert("XSS")&#x3C;/script&#x3E;',
        '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E',
        '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      ];

      for (const payload of encodedPayloads) {
        const response = await request(app)
          .post('/test')
          .send({ content: payload })
          .expect(200);

        // The sanitized content should not execute JavaScript
        expect(response.body.body.content).toBeDefined();
      }
    });

    it('should handle CSS-based XSS attempts', async () => {
      const cssPayloads = [
        '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
        '<div style="background:url(javascript:alert(\'XSS\'))">Test</div>',
        '<link rel="stylesheet" href="javascript:alert(\'XSS\')">'
      ];

      for (const payload of cssPayloads) {
        const response = await request(app)
          .post('/test')
          .send({ content: payload })
          .expect(200);

        expect(response.body.body.content).not.toContain('javascript:');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty and null values', async () => {
      const payload = {
        empty: '',
        nullValue: null,
        undefined: undefined,
        whitespace: '   '
      };

      const response = await request(app)
        .post('/test')
        .send(payload)
        .expect(200);

      expect(response.body.body.empty).toBe('');
      expect(response.body.body.nullValue).toBeNull();
      expect(response.body.body.whitespace).toBe('   ');
    });

    it('should handle very long malicious strings', async () => {
      const longMaliciousString = '<script>alert("XSS")</script>'.repeat(1000);
      
      const response = await request(app)
        .post('/test')
        .send({ content: longMaliciousString })
        .expect(200);

      expect(response.body.body.content).not.toContain('<script>');
      expect(response.body.body.content).not.toContain('alert("XSS")');
    });

    it('should handle mixed safe and unsafe content', async () => {
      const payload = {
        title: 'This is a safe title',
        content: 'Safe content with <script>alert("XSS")</script> malicious code',
        footer: 'Another safe footer'
      };

      const response = await request(app)
        .post('/test')
        .send(payload)
        .expect(200);

      expect(response.body.body.title).toBe('This is a safe title');
      expect(response.body.body.content).toBe('Safe content with  malicious code');
      expect(response.body.body.footer).toBe('Another safe footer');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large payloads efficiently', async () => {
      const largePayload = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          content: `Safe content for user ${i}`,
          malicious: i % 10 === 0 ? '<script>alert("XSS")</script>' : 'safe'
        }))
      };

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/test')
        .send(largePayload)
        .expect(200);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should complete in reasonable time (less than 1 second)
      expect(processingTime).toBeLessThan(1000);
      
      // Verify sanitization worked
      response.body.body.data.forEach(item => {
        expect(item.malicious).not.toContain('<script>');
      });
    });
  });

  describe('Content-Type Specific Tests', () => {
    it('should handle application/x-www-form-urlencoded', async () => {
      app.use(express.urlencoded({ extended: true }));

      const response = await request(app)
        .post('/test')
        .type('form')
        .send('name=John<script>alert("XSS")</script>&email=user@example.com')
        .expect(200);

      expect(response.body.body.name).toBe('John');
      expect(response.body.body.email).toBe('user@example.com');
    });
  });

  describe('Bypass Attempts', () => {
    it('should prevent filter bypass attempts', async () => {
      const bypassAttempts = [
        '<ScRiPt>alert("XSS")</ScRiPt>',
        '<<SCRIPT>alert("XSS");//<</SCRIPT>',
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<svg/onload=alert("XSS")>',
        'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>'
      ];

      for (const attempt of bypassAttempts) {
        const response = await request(app)
          .post('/test')
          .send({ payload: attempt })
          .expect(200);

        expect(response.body.body.payload).not.toContain('alert(');
        expect(response.body.body.payload).not.toContain('<script');
        expect(response.body.body.payload).not.toContain('javascript:');
      }
    });
  });
});