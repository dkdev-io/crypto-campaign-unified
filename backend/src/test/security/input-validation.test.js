import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { TestHelpers } from '../utils/testHelpers.js';

describe('Input Validation Security Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Error handler for validation
    const handleValidationErrors = (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
          code: 'VALIDATION_ERROR',
        });
      }
      next();
    };

    // Campaign creation endpoint with comprehensive validation
    app.post(
      '/api/campaign',
      [
        body('campaign_name')
          .isLength({ min: 3, max: 100 })
          .withMessage('Campaign name must be between 3 and 100 characters')
          .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
          .withMessage('Campaign name contains invalid characters')
          .escape(),
        body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
        body('website')
          .optional({ checkFalsy: true })
          .isURL({ protocols: ['http', 'https'], require_protocol: true })
          .withMessage('Invalid website URL')
          .custom((value) => {
            // Block suspicious domains
            const suspiciousDomains = ['evil.com', 'malware.org', 'phishing.net'];
            const url = new URL(value);
            if (suspiciousDomains.includes(url.hostname)) {
              throw new Error('Suspicious domain detected');
            }
            return true;
          }),
        body('description')
          .optional()
          .isLength({ max: 1000 })
          .withMessage('Description too long')
          .escape(),
        body('phone')
          .optional()
          .isMobilePhone('any', { strictMode: false })
          .withMessage('Invalid phone number format'),
        body('target_amount')
          .optional()
          .isFloat({ min: 0, max: 1000000 })
          .withMessage('Target amount must be between 0 and 1,000,000'),
        body('category')
          .optional()
          .isIn(['political', 'charity', 'business', 'personal', 'other'])
          .withMessage('Invalid category'),
      ],
      handleValidationErrors,
      (req, res) => {
        res.status(201).json({ message: 'Campaign created', data: req.body });
      }
    );

    // User registration endpoint
    app.post(
      '/api/users',
      [
        body('username')
          .isLength({ min: 3, max: 30 })
          .withMessage('Username must be between 3 and 30 characters')
          .matches(/^[a-zA-Z0-9_]+$/)
          .withMessage('Username can only contain letters, numbers, and underscores')
          .escape(),
        body('email')
          .isEmail()
          .withMessage('Invalid email format')
          .custom(async (value) => {
            // Simulate checking for existing email
            if (value === 'taken@example.com') {
              throw new Error('Email already exists');
            }
            return true;
          })
          .normalizeEmail(),
        body('password')
          .isLength({ min: 8, max: 128 })
          .withMessage('Password must be between 8 and 128 characters')
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .withMessage(
            'Password must contain at least one lowercase letter, uppercase letter, number, and special character'
          ),
        body('age')
          .optional()
          .isInt({ min: 13, max: 120 })
          .withMessage('Age must be between 13 and 120'),
        body('terms_accepted').equals('true').withMessage('Terms must be accepted'),
        body('newsletter')
          .optional()
          .isBoolean()
          .withMessage('Newsletter preference must be boolean'),
      ],
      handleValidationErrors,
      (req, res) => {
        res.status(201).json({ message: 'User registered', data: req.body });
      }
    );

    // KYC submission endpoint
    app.post(
      '/api/kyc',
      [
        body('wallet_address')
          .matches(/^0x[a-fA-F0-9]{40}$/)
          .withMessage('Invalid Ethereum address format'),
        body('full_name')
          .isLength({ min: 2, max: 100 })
          .withMessage('Full name must be between 2 and 100 characters')
          .matches(/^[a-zA-Z\s\-.,']+$/)
          .withMessage('Full name contains invalid characters')
          .escape(),
        body('document_type')
          .isIn(['passport', 'drivers_license', 'national_id'])
          .withMessage('Invalid document type'),
        body('document_number')
          .isLength({ min: 5, max: 30 })
          .withMessage('Document number must be between 5 and 30 characters')
          .matches(/^[a-zA-Z0-9\-]+$/)
          .withMessage('Document number contains invalid characters'),
        body('date_of_birth')
          .isISO8601({ strict: true })
          .withMessage('Invalid date format')
          .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 18 || age > 120) {
              throw new Error('Age must be between 18 and 120');
            }
            return true;
          }),
        body('country').isISO31661Alpha2().withMessage('Invalid country code'),
        body('ssn')
          .optional()
          .matches(/^\d{3}-\d{2}-\d{4}$/)
          .withMessage('Invalid SSN format (XXX-XX-XXXX)'),
        body('document_images')
          .isArray({ min: 1, max: 3 })
          .withMessage('Must provide 1-3 document images')
          .custom((images) => {
            for (const image of images) {
              if (!image.match(/^data:image\/(jpeg|jpg|png);base64,/)) {
                throw new Error('Invalid image format');
              }
              // Check base64 size (approximate file size)
              const base64Size = image.length * 0.75;
              if (base64Size > 5 * 1024 * 1024) {
                // 5MB limit
                throw new Error('Image too large (max 5MB)');
              }
            }
            return true;
          }),
      ],
      handleValidationErrors,
      (req, res) => {
        res.status(201).json({ message: 'KYC submitted', data: req.body });
      }
    );

    // Search endpoint with query validation
    app.get(
      '/api/search',
      [
        query('q')
          .optional()
          .isLength({ min: 1, max: 100 })
          .withMessage('Search query must be between 1 and 100 characters')
          .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
          .withMessage('Search query contains invalid characters')
          .escape(),
        query('category')
          .optional()
          .isIn(['campaigns', 'users', 'transactions'])
          .withMessage('Invalid search category'),
        query('limit')
          .optional()
          .isInt({ min: 1, max: 100 })
          .withMessage('Limit must be between 1 and 100')
          .toInt(),
        query('offset')
          .optional()
          .isInt({ min: 0 })
          .withMessage('Offset must be non-negative')
          .toInt(),
        query('sort')
          .optional()
          .isIn(['date', 'name', 'amount', 'relevance'])
          .withMessage('Invalid sort option'),
        query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
      ],
      handleValidationErrors,
      (req, res) => {
        res.json({ message: 'Search completed', query: req.query });
      }
    );

    // Parameter validation endpoint
    app.get(
      '/api/campaigns/:id',
      [param('id').isUUID().withMessage('Invalid campaign ID format')],
      handleValidationErrors,
      (req, res) => {
        res.json({ message: 'Campaign retrieved', id: req.params.id });
      }
    );

    // Contribution endpoint
    app.post(
      '/api/contributions',
      [
        body('wallet_address')
          .matches(/^0x[a-fA-F0-9]{40}$/)
          .withMessage('Invalid Ethereum address format'),
        body('amount')
          .isFloat({ min: 0.001, max: 10.0 })
          .withMessage('Amount must be between 0.001 and 10.0 ETH'),
        body('transaction_hash')
          .matches(/^0x[a-fA-F0-9]{64}$/)
          .withMessage('Invalid transaction hash format'),
        body('message')
          .optional()
          .isLength({ max: 500 })
          .withMessage('Message too long (max 500 characters)')
          .escape(),
        body('anonymous').optional().isBoolean().withMessage('Anonymous flag must be boolean'),
      ],
      handleValidationErrors,
      (req, res) => {
        res.status(201).json({ message: 'Contribution recorded', data: req.body });
      }
    );
  });

  describe('Campaign Validation Tests', () => {
    it('should accept valid campaign data', async () => {
      const validData = {
        campaign_name: 'Test Campaign',
        email: 'test@example.com',
        website: 'https://example.com',
        description: 'A valid campaign description',
        target_amount: 1000,
      };

      const response = await request(app).post('/api/campaign').send(validData).expect(201);

      expect(response.body.message).toBe('Campaign created');
      expect(response.body.data.campaign_name).toBe('Test Campaign');
    });

    it('should reject campaign with invalid name', async () => {
      const invalidData = {
        campaign_name: 'Te', // Too short
        email: 'test@example.com',
      };

      const response = await request(app).post('/api/campaign').send(invalidData).expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toContain('between 3 and 100 characters');
    });

    it('should reject campaign with malicious characters in name', async () => {
      const maliciousData = {
        campaign_name: 'Test <script>alert("xss")</script>',
        email: 'test@example.com',
      };

      const response = await request(app).post('/api/campaign').send(maliciousData).expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toContain('invalid characters');
    });

    it('should reject campaign with invalid email', async () => {
      const invalidData = {
        campaign_name: 'Test Campaign',
        email: 'invalid-email',
      };

      const response = await request(app).post('/api/campaign').send(invalidData).expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Invalid email format');
    });

    it('should reject campaign with suspicious website domain', async () => {
      const suspiciousData = {
        campaign_name: 'Test Campaign',
        email: 'test@example.com',
        website: 'https://evil.com',
      };

      const response = await request(app).post('/api/campaign').send(suspiciousData).expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Suspicious domain detected');
    });

    it('should sanitize HTML in description', async () => {
      const dataWithHTML = {
        campaign_name: 'Test Campaign',
        email: 'test@example.com',
        description: '<p>Valid content</p><script>alert("xss")</script>',
      };

      const response = await request(app).post('/api/campaign').send(dataWithHTML).expect(201);

      // Should escape HTML
      expect(response.body.data.description).not.toContain('<script>');
      expect(response.body.data.description).toContain('&lt;p&gt;');
    });
  });

  describe('User Registration Validation Tests', () => {
    it('should accept valid user registration', async () => {
      const validData = {
        username: 'testuser123',
        email: 'user@example.com',
        password: 'SecurePass123!',
        terms_accepted: 'true',
      };

      const response = await request(app).post('/api/users').send(validData).expect(201);

      expect(response.body.message).toBe('User registered');
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password', // No uppercase, numbers, or special chars
        'PASSWORD123', // No lowercase or special chars
        'Password!', // Too short
        '12345678', // No letters
        'Passw0rd', // No special characters
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/users')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            password: password,
            terms_accepted: 'true',
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details[0].msg).toContain('Password must contain');
      }
    });

    it('should reject invalid usernames', async () => {
      const invalidUsernames = [
        'ab', // Too short
        'user@name', // Invalid character
        'user name', // Space not allowed
        'a'.repeat(31), // Too long
        '123-456', // Dash not allowed
      ];

      for (const username of invalidUsernames) {
        const response = await request(app)
          .post('/api/users')
          .send({
            username: username,
            email: 'test@example.com',
            password: 'SecurePass123!',
            terms_accepted: 'true',
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      }
    });

    it('should reject registration without accepting terms', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          terms_accepted: 'false',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Terms must be accepted');
    });

    it('should check for existing email addresses', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'taken@example.com', // This email is marked as taken in our mock
          password: 'SecurePass123!',
          terms_accepted: 'true',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Email already exists');
    });
  });

  describe('KYC Validation Tests', () => {
    it('should accept valid KYC data', async () => {
      const validData = {
        wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
        full_name: 'John Doe',
        document_type: 'passport',
        document_number: 'AB123456789',
        date_of_birth: '1990-01-01',
        country: 'US',
        document_images: [
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        ],
      };

      const response = await request(app).post('/api/kyc').send(validData).expect(201);

      expect(response.body.message).toBe('KYC submitted');
    });

    it('should reject invalid Ethereum address', async () => {
      const invalidAddresses = [
        '0x123', // Too short
        '742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4', // Missing 0x prefix
        '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39G4', // Invalid character 'G'
        '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d44', // Too long
      ];

      for (const address of invalidAddresses) {
        const response = await request(app)
          .post('/api/kyc')
          .send({
            wallet_address: address,
            full_name: 'John Doe',
            document_type: 'passport',
            document_number: 'AB123456789',
            date_of_birth: '1990-01-01',
            country: 'US',
            document_images: ['data:image/jpeg;base64,validdata'],
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      }
    });

    it('should reject underage users', async () => {
      const today = new Date();
      const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());

      const response = await request(app)
        .post('/api/kyc')
        .send({
          wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
          full_name: 'John Doe',
          document_type: 'passport',
          document_number: 'AB123456789',
          date_of_birth: underageDate.toISOString().split('T')[0],
          country: 'US',
          document_images: ['data:image/jpeg;base64,validdata'],
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Age must be between 18 and 120');
    });

    it('should reject invalid document types', async () => {
      const response = await request(app)
        .post('/api/kyc')
        .send({
          wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
          full_name: 'John Doe',
          document_type: 'invalid_document',
          document_number: 'AB123456789',
          date_of_birth: '1990-01-01',
          country: 'US',
          document_images: ['data:image/jpeg;base64,validdata'],
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Invalid document type');
    });

    it('should reject oversized images', async () => {
      // Create a very large base64 string (simulating a large image)
      const largeImageData = 'data:image/jpeg;base64,' + 'A'.repeat(10 * 1024 * 1024); // ~10MB

      const response = await request(app)
        .post('/api/kyc')
        .send({
          wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
          full_name: 'John Doe',
          document_type: 'passport',
          document_number: 'AB123456789',
          date_of_birth: '1990-01-01',
          country: 'US',
          document_images: [largeImageData],
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Image too large (max 5MB)');
    });
  });

  describe('Search Query Validation Tests', () => {
    it('should accept valid search queries', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          q: 'test query',
          category: 'campaigns',
          limit: 20,
          offset: 0,
          sort: 'date',
          order: 'desc',
        })
        .expect(200);

      expect(response.body.message).toBe('Search completed');
      expect(response.body.query.limit).toBe(20);
    });

    it('should reject invalid search parameters', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({
          limit: 200, // Exceeds maximum
          offset: -1, // Negative offset
          sort: 'invalid_sort',
          order: 'invalid_order',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThan(1);
    });

    it('should sanitize search queries', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: '<script>alert("xss")</script>test' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Contribution Validation Tests', () => {
    it('should accept valid contribution data', async () => {
      const validData = {
        wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
        amount: 1.5,
        transaction_hash: '0x1234567890123456789012345678901234567890123456789012345678901234',
        message: 'Great campaign!',
        anonymous: false,
      };

      const response = await request(app).post('/api/contributions').send(validData).expect(201);

      expect(response.body.message).toBe('Contribution recorded');
    });

    it('should reject contributions with invalid amounts', async () => {
      const invalidAmounts = [
        0, // Below minimum
        0.0005, // Below minimum
        15.0, // Above maximum
        -1.0, // Negative
        'invalid', // Non-numeric
      ];

      for (const amount of invalidAmounts) {
        const response = await request(app)
          .post('/api/contributions')
          .send({
            wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
            amount: amount,
            transaction_hash: '0x1234567890123456789012345678901234567890123456789012345678901234',
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      }
    });

    it('should reject invalid transaction hashes', async () => {
      const invalidHashes = [
        '0x123', // Too short
        '1234567890123456789012345678901234567890123456789012345678901234', // Missing 0x
        '0x123456789012345678901234567890123456789012345678901234567890123G', // Invalid character
        '0x12345678901234567890123456789012345678901234567890123456789012345', // Too long
      ];

      for (const hash of invalidHashes) {
        const response = await request(app)
          .post('/api/contributions')
          .send({
            wallet_address: '0x742c4F8c2FC9c809Ea6C0d53b43d8f2b5a3E39d4',
            amount: 1.0,
            transaction_hash: hash,
          })
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
      }
    });
  });

  describe('Parameter Validation Tests', () => {
    it('should accept valid UUID parameters', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app).get(`/api/campaigns/${validUUID}`).expect(200);

      expect(response.body.message).toBe('Campaign retrieved');
      expect(response.body.id).toBe(validUUID);
    });

    it('should reject invalid UUID parameters', async () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '123',
        '123e4567-e89b-12d3-a456', // Too short
        '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
      ];

      for (const uuid of invalidUUIDs) {
        const response = await request(app).get(`/api/campaigns/${uuid}`).expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details[0].msg).toBe('Invalid campaign ID format');
      }
    });
  });

  describe('Edge Cases and Attack Vectors', () => {
    it('should handle extremely large payloads', async () => {
      const largePayload = {
        campaign_name: 'A'.repeat(10000), // Exceeds limit
        email: 'test@example.com',
      };

      const response = await request(app).post('/api/campaign').send(largePayload).expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle null and undefined values appropriately', async () => {
      const response = await request(app)
        .post('/api/campaign')
        .send({
          campaign_name: null,
          email: undefined,
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle nested object injection attempts', async () => {
      const response = await request(app)
        .post('/api/campaign')
        .send({
          campaign_name: 'Test',
          email: 'test@example.com',
          nested: {
            malicious: '<script>alert("xss")</script>',
            prototype: {
              pollution: 'attempt',
            },
          },
        })
        .expect(201); // Should pass but nested objects should be ignored

      expect(response.body.data.nested).toBeUndefined();
    });

    it('should handle array injection attempts', async () => {
      const response = await request(app)
        .post('/api/campaign')
        .send({
          campaign_name: ['Test', '<script>alert("xss")</script>'],
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should prevent prototype pollution attempts', async () => {
      const response = await request(app)
        .post('/api/campaign')
        .send({
          __proto__: { polluted: true },
          campaign_name: 'Test',
          email: 'test@example.com',
        })
        .expect(201);

      // Should not pollute the prototype
      expect({}.polluted).toBeUndefined();
    });
  });

  describe('Content-Type and Encoding Tests', () => {
    it('should handle URL-encoded data properly', async () => {
      const response = await request(app)
        .post('/api/campaign')
        .type('form')
        .send('campaign_name=Test%20Campaign&email=test@example.com')
        .expect(201);

      expect(response.body.data.campaign_name).toBe('Test Campaign');
    });

    it('should reject oversized requests', async () => {
      // This test assumes the app has a size limit set
      const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB of data

      const response = await request(app)
        .post('/api/campaign')
        .send({
          campaign_name: 'Test',
          email: 'test@example.com',
          large_field: largeData,
        })
        .expect(413); // Payload Too Large

      expect(response.text).toContain('request entity too large');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/campaign')
        .type('json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.text).toContain('Unexpected token');
    });
  });
});
