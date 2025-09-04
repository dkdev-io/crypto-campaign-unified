import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { validateInput } from '../../middleware/security.js';
import { validationResult } from 'express-validator';
import { TestHelpers } from '../utils/testHelpers.js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      filter: jest.fn(() => Promise.resolve({ data: [], error: null })),
      ilike: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
};

describe('SQL Injection Prevention Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Middleware to handle validation errors
    const handleValidationErrors = (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Input validation failed',
          details: errors.array(),
          code: 'VALIDATION_ERROR',
        });
      }
      next();
    };

    // Test endpoints with SQL injection prevention
    app.post('/api/users', validateInput, handleValidationErrors, (req, res) => {
      res.json({ message: 'User created', data: req.body });
    });

    app.get('/api/search', validateInput, handleValidationErrors, (req, res) => {
      res.json({ message: 'Search completed', query: req.query });
    });

    app.put('/api/users/:id', validateInput, handleValidationErrors, (req, res) => {
      res.json({ message: 'User updated', id: req.params.id, data: req.body });
    });

    // Simulated database query endpoint (for testing purposes)
    app.post('/api/unsafe-query', (req, res) => {
      // This endpoint simulates unsafe SQL queries
      const { query, params } = req.body;

      // Simulate potential SQL injection vulnerability
      if ((query && query.includes('DROP')) || query.includes('DELETE')) {
        return res.status(400).json({
          error: 'Potentially dangerous query detected',
          code: 'DANGEROUS_QUERY',
        });
      }

      res.json({ message: 'Query executed', query, params });
    });

    jest.clearAllMocks();
  });

  describe('Basic SQL Injection Patterns', () => {
    it('should block classic SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await request(app)
          .post('/api/users')
          .send({
            name: maliciousInput,
            email: 'test@example.com',
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Input contains potentially dangerous characters',
            }),
          ])
        );
      }
    });

    it('should block time-based SQL injection attempts', async () => {
      const timeBasedPayloads = [
        "'; WAITFOR DELAY '00:00:05' --",
        "' OR SLEEP(5) --",
        "'; SELECT pg_sleep(5) --",
        "' AND (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM users) --",
      ];

      for (const payload of timeBasedPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            name: payload,
            email: 'test@example.com',
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block boolean-based SQL injection attempts', async () => {
      const booleanPayloads = [
        "' AND 1=1 --",
        "' AND 1=2 --",
        "' OR 'a'='a",
        "' OR EXISTS(SELECT * FROM users WHERE id=1) --",
      ];

      for (const payload of booleanPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            description: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block UNION-based SQL injection attempts', async () => {
      const unionPayloads = [
        "' UNION SELECT username, password FROM users --",
        "' UNION ALL SELECT null, null, null --",
        "' UNION SELECT 1, 2, 3, 4, 5 --",
        "' UNION SELECT table_name FROM information_schema.tables --",
      ];

      for (const payload of unionPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            bio: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });
  });

  describe('Advanced SQL Injection Techniques', () => {
    it('should block stored procedure execution attempts', async () => {
      const storedProcPayloads = [
        "'; EXEC xp_cmdshell('dir'); --",
        "'; CALL system('rm -rf /'); --",
        "'; EXEC sp_configure 'show advanced options', 1 --",
      ];

      for (const payload of storedProcPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            notes: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block information schema attacks', async () => {
      const infoSchemaPayloads = [
        "' UNION SELECT column_name FROM information_schema.columns --",
        "' AND (SELECT COUNT(*) FROM information_schema.tables) > 0 --",
        "' UNION SELECT schema_name FROM information_schema.schemata --",
      ];

      for (const payload of infoSchemaPayloads) {
        const response = await request(app).get('/api/search').query({ q: payload }).expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block second-order SQL injection attempts', async () => {
      // First, try to insert malicious data
      const maliciousData = "admin'; DROP TABLE sessions; --";

      const insertResponse = await request(app)
        .post('/api/users')
        .send({
          username: maliciousData,
          email: 'test@example.com',
        })
        .expect(400);

      expect(insertResponse.body.error).toBe('Input validation failed');

      // Verify that even if the data were to be stored and later used in a query,
      // it would be properly escaped
      const updateResponse = await request(app)
        .put('/api/users/1')
        .send({
          username: maliciousData,
        })
        .expect(400);

      expect(updateResponse.body.error).toBe('Input validation failed');
    });

    it('should block blind SQL injection attempts', async () => {
      const blindPayloads = [
        "' AND ASCII(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1))=97 --",
        "' AND LENGTH((SELECT password FROM users WHERE id=1))>0 --",
        "' AND (SELECT COUNT(*) FROM users WHERE username='admin' AND password LIKE 'a%')=1 --",
      ];

      for (const payload of blindPayloads) {
        const response = await request(app)
          .get('/api/search')
          .query({ filter: payload })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should block MongoDB injection attempts', async () => {
      const noSqlPayloads = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.password.length > 0"}',
        '{"$regex": ".*"}',
        '{"$or": [{"username": "admin"}, {"username": "root"}]}',
      ];

      for (const payload of noSqlPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            filter: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block JavaScript code injection in NoSQL queries', async () => {
      const jsInjectionPayloads = [
        "'; return 1; var dummy='",
        '"; delete db.users; var x="',
        '"; while(true){} var y="',
        '"; db.users.drop(); var z="',
      ];

      for (const payload of jsInjectionPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            script: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });
  });

  describe('Encoding and Obfuscation Bypass Attempts', () => {
    it('should block URL-encoded SQL injection attempts', async () => {
      const encodedPayloads = [
        '%27%20OR%20%271%27%3D%271', // ' OR '1'='1
        '%27%3B%20DROP%20TABLE%20users%3B%20--', // '; DROP TABLE users; --
        '%27%20UNION%20SELECT%20*%20FROM%20users%20--', // ' UNION SELECT * FROM users --
      ];

      for (const payload of encodedPayloads) {
        const response = await request(app)
          .get('/api/search')
          .query({ q: decodeURIComponent(payload) })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block hex-encoded SQL injection attempts', async () => {
      const hexPayloads = [
        '0x53454C454354202A2046524F4D207573657273', // SELECT * FROM users
        '0x44524F50205441424C452075736572733B', // DROP TABLE users;
      ];

      for (const payload of hexPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            data: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block comment-based obfuscation', async () => {
      const commentPayloads = [
        "' /*comment*/ OR /*comment*/ '1'='1",
        "'; /*comment*/ DROP /*comment*/ TABLE users; --",
        "' UNION /*comment*/ SELECT * FROM users --",
      ];

      for (const payload of commentPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({
            comment: payload,
          })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });
  });

  describe('Content-Type Specific Tests', () => {
    it('should validate URL-encoded form data', async () => {
      const response = await request(app)
        .post('/api/users')
        .type('form')
        .send("name='; DROP TABLE users; --&email=test@example.com")
        .expect(400);

      expect(response.body.error).toBe('Input validation failed');
    });

    it('should validate JSON payloads', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: "'; DROP TABLE users; --",
          email: 'test@example.com',
          preferences: {
            theme: "' OR 1=1 --",
          },
        })
        .expect(400);

      expect(response.body.error).toBe('Input validation failed');
    });
  });

  describe('Parameterized Query Simulation', () => {
    it('should demonstrate safe parameterized query patterns', async () => {
      // Simulate a safe endpoint that uses parameterized queries
      app.post('/api/safe-query', (req, res) => {
        const { username, email } = req.body;

        // Simulate parameterized query (this would be done by ORM/query builder)
        const query = 'SELECT * FROM users WHERE username = $1 AND email = $2';
        const params = [username, email];

        // Even with malicious input, parameterized queries are safe
        res.json({
          message: 'Safe query executed',
          query: query,
          params: params,
          safe: true,
        });
      });

      const response = await request(app)
        .post('/api/safe-query')
        .send({
          username: "'; DROP TABLE users; --",
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body.safe).toBe(true);
      expect(response.body.params[0]).toBe("'; DROP TABLE users; --");
      // The malicious input is safely passed as a parameter
    });

    it('should demonstrate unsafe string concatenation (for comparison)', async () => {
      const maliciousQuery =
        "SELECT * FROM users WHERE username = '" + "'; DROP TABLE users; --" + "'";

      const response = await request(app)
        .post('/api/unsafe-query')
        .send({
          query: maliciousQuery,
        })
        .expect(400);

      expect(response.body.error).toBe('Potentially dangerous query detected');
    });
  });

  describe('Database-Specific Injection Tests', () => {
    it('should block PostgreSQL-specific injection attempts', async () => {
      const pgPayloads = [
        "'; SELECT pg_stat_activity; --",
        "'; COPY users TO '/tmp/users.csv'; --",
        "'; CREATE EXTENSION IF NOT EXISTS plpythonu; --",
      ];

      for (const payload of pgPayloads) {
        const response = await request(app).post('/api/users').send({ bio: payload }).expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should block MySQL-specific injection attempts', async () => {
      const mysqlPayloads = [
        "'; SELECT * FROM mysql.user; --",
        "'; LOAD DATA INFILE '/etc/passwd' INTO TABLE temp; --",
        "'; SELECT @@version; --",
      ];

      for (const payload of mysqlPayloads) {
        const response = await request(app).post('/api/users').send({ notes: payload }).expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle very long malicious strings', async () => {
      const longMaliciousString = "'; DROP TABLE users; --".repeat(1000);

      const response = await request(app)
        .post('/api/users')
        .send({ description: longMaliciousString })
        .expect(400);

      expect(response.body.error).toBe('Input validation failed');
    });

    it('should handle nested objects with SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          profile: {
            bio: "'; DROP TABLE users; --",
            preferences: {
              theme: "' OR 1=1 --",
            },
          },
        })
        .expect(400);

      expect(response.body.error).toBe('Input validation failed');
    });

    it('should handle arrays with SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          tags: ['safe-tag', "'; DROP TABLE users; --", "' OR 1=1 --"],
        })
        .expect(400);

      expect(response.body.error).toBe('Input validation failed');
    });

    it('should preserve safe input while blocking dangerous input', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: "John O'Connor", // Apostrophe but not malicious
          email: 'john@example.com',
          bio: "I'm a software developer", // Apostrophes in safe context
        })
        .expect(200);

      expect(response.body.message).toBe('User created');
      expect(response.body.data.name).toBe('John OConnor'); // Sanitized
      expect(response.body.data.email).toBe('john@example.com');
    });
  });

  describe('Real-world Attack Simulation', () => {
    it('should prevent credential theft attempts', async () => {
      const credentialTheftPayloads = [
        "' UNION SELECT username, password FROM admin_users --",
        "' OR username='admin' AND password='password' --",
        "'; SELECT * FROM users WHERE role='admin'; --",
      ];

      for (const payload of credentialTheftPayloads) {
        const response = await request(app)
          .get('/api/search')
          .query({ username: payload })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should prevent data exfiltration attempts', async () => {
      const exfiltrationPayloads = [
        "' UNION SELECT credit_card_number FROM payments --",
        "' UNION SELECT email, phone FROM users --",
        "'; SELECT * FROM sensitive_data; --",
      ];

      for (const payload of exfiltrationPayloads) {
        const response = await request(app)
          .post('/api/users')
          .send({ search: payload })
          .expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });

    it('should prevent privilege escalation attempts', async () => {
      const privilegeEscalationPayloads = [
        "'; UPDATE users SET role='admin' WHERE username='attacker'; --",
        "'; INSERT INTO admin_users VALUES ('hacker', 'password'); --",
        "'; GRANT ALL PRIVILEGES ON *.* TO 'attacker'@'%'; --",
      ];

      for (const payload of privilegeEscalationPayloads) {
        const response = await request(app).put('/api/users/1').send({ role: payload }).expect(400);

        expect(response.body.error).toBe('Input validation failed');
      }
    });
  });
});
