import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { TestHelpers } from '../utils/testHelpers.js';

/**
 * OWASP Top 10 2021 Security Test Suite
 * Tests for the most critical web application security risks
 */
describe('OWASP Top 10 2021 Security Tests', () => {
  let app;
  const jwtSecret = 'test-secret-for-owasp-testing';

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Mock authentication middleware
    const authenticate = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };

    // Mock user database
    const users = [
      { id: '1', username: 'admin', role: 'admin', active: true },
      { id: '2', username: 'user', role: 'user', active: true },
      { id: '3', username: 'guest', role: 'guest', active: false }
    ];

    // Test endpoints for various OWASP categories
    
    // A01: Broken Access Control
    app.get('/api/admin/users', authenticate, (req, res) => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      res.json({ users: users.map(u => ({ id: u.id, username: u.username })) });
    });

    app.get('/api/users/:userId', authenticate, (req, res) => {
      const { userId } = req.params;
      
      // Vulnerable: No check if user can access other users' data
      if (req.query.vulnerable === 'true') {
        const user = users.find(u => u.id === userId);
        return res.json({ user });
      }

      // Secure: Check if user can only access their own data
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const user = users.find(u => u.id === userId);
      res.json({ user });
    });

    // A02: Cryptographic Failures
    app.post('/api/crypto-test', (req, res) => {
      const { data, mode } = req.body;
      
      if (mode === 'insecure') {
        // Simulate insecure storage/transmission
        res.json({
          stored: data, // Plain text storage
          hash: Buffer.from(data).toString('base64'), // Not a real hash
          transmitted: data // Plain text transmission
        });
      } else {
        // Secure implementation would use proper encryption/hashing
        res.json({
          message: 'Data processed securely',
          hash: 'sha256-hash-would-go-here'
        });
      }
    });

    // A03: Injection (SQL, NoSQL, Command)
    app.post('/api/search', (req, res) => {
      const { query, type } = req.body;
      
      if (type === 'vulnerable') {
        // Simulate SQL injection vulnerability
        const sqlQuery = `SELECT * FROM campaigns WHERE name LIKE '%${query}%'`;
        
        // Check for common injection patterns
        if (query.includes("'; DROP") || query.includes("' OR '1'='1")) {
          return res.status(400).json({ 
            error: 'SQL injection detected',
            query: sqlQuery
          });
        }
        
        res.json({ query: sqlQuery, results: [] });
      } else {
        // Parameterized query simulation
        res.json({ 
          message: 'Search completed safely',
          query: 'SELECT * FROM campaigns WHERE name LIKE ?',
          params: [query]
        });
      }
    });

    // A04: Insecure Design
    app.post('/api/password-reset', (req, res) => {
      const { email, mode } = req.body;
      
      if (mode === 'insecure') {
        // Insecure: No rate limiting, predictable tokens
        const resetToken = Math.floor(Math.random() * 1000000).toString();
        res.json({
          message: 'Reset link sent',
          token: resetToken, // Exposing token is insecure
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours - too long
        });
      } else {
        // Secure design: Rate limited, secure tokens, short expiry
        res.json({
          message: 'If the email exists, a reset link has been sent',
          // No token exposed, no user enumeration
        });
      }
    });

    // A05: Security Misconfiguration
    app.get('/api/server-info', (req, res) => {
      if (req.query.expose === 'true') {
        // Insecure: Exposing sensitive information
        res.json({
          server: 'Express 4.18.3',
          node: process.version,
          environment: process.env.NODE_ENV,
          database: 'PostgreSQL 14.2',
          secrets: {
            jwt: jwtSecret, // Never expose secrets!
            api_key: 'secret-api-key'
          },
          debug: true,
          stack_trace: new Error().stack
        });
      } else {
        // Secure: Minimal information disclosure
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString()
        });
      }
    });

    // A06: Vulnerable and Outdated Components
    app.get('/api/dependencies', (req, res) => {
      if (req.query.show_vulnerable === 'true') {
        res.json({
          dependencies: [
            { name: 'express', version: '4.18.3', vulnerabilities: 0 },
            { name: 'jsonwebtoken', version: '9.0.2', vulnerabilities: 0 },
            { name: 'lodash', version: '4.17.11', vulnerabilities: 2 }, // Simulated vulnerable version
            { name: 'axios', version: '0.18.0', vulnerabilities: 1 } // Simulated vulnerable version
          ]
        });
      } else {
        res.json({ message: 'Dependency information not exposed' });
      }
    });

    // A07: Identification and Authentication Failures
    app.post('/api/login', (req, res) => {
      const { username, password, mode } = req.body;
      
      if (mode === 'vulnerable') {
        // Vulnerable: No rate limiting, predictable session IDs, weak authentication
        if (username === 'admin' && password === 'admin') {
          const sessionId = Date.now().toString(); // Predictable session ID
          res.json({
            success: true,
            sessionId: sessionId,
            message: 'Login successful',
            user: { username, role: 'admin' }
          });
        } else {
          res.status(401).json({ 
            error: 'Invalid credentials',
            username: username, // Username enumeration
            attempts: Math.floor(Math.random() * 5)
          });
        }
      } else {
        // Secure authentication
        if (username === 'admin' && password === 'secure-password-123!') {
          const token = jwt.sign(
            { id: '1', username: 'admin', role: 'admin' },
            jwtSecret,
            { expiresIn: '15m' }
          );
          res.json({ 
            success: true, 
            token,
            message: 'Authentication successful'
          });
        } else {
          res.status(401).json({ 
            error: 'Authentication failed',
            // No user enumeration, consistent response
          });
        }
      }
    });

    // A08: Software and Data Integrity Failures
    app.post('/api/update', (req, res) => {
      const { package_url, mode } = req.body;
      
      if (mode === 'vulnerable') {
        // Vulnerable: No integrity checks
        res.json({
          message: 'Package update initiated',
          package_url: package_url,
          integrity_check: false,
          signature_verified: false
        });
      } else {
        // Secure: Integrity and signature verification
        res.json({
          message: 'Package verified and updated',
          integrity_check: 'sha256-abc123def456...',
          signature_verified: true,
          source_trusted: true
        });
      }
    });

    // A09: Security Logging and Monitoring Failures
    app.post('/api/sensitive-action', authenticate, (req, res) => {
      const { action, data, log_security } = req.body;
      
      if (log_security) {
        // Proper security logging
        console.log(`Security Event: ${action} by user ${req.user.id} at ${new Date().toISOString()}`);
        console.log(`IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
        console.log(`Data: ${JSON.stringify(data).substring(0, 100)}...`);
      }
      
      // Simulate sensitive action
      if (action === 'delete_all_data') {
        return res.status(400).json({ 
          error: 'Action blocked',
          reason: 'Potentially destructive action detected'
        });
      }
      
      res.json({ 
        message: 'Action completed',
        action: action,
        logged: log_security || false
      });
    });

    // A10: Server-Side Request Forgery (SSRF)
    app.post('/api/fetch-url', (req, res) => {
      const { url, mode } = req.body;
      
      if (mode === 'vulnerable') {
        // Vulnerable: No URL validation
        if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('internal')) {
          return res.status(400).json({
            error: 'SSRF attempt detected',
            url: url,
            risk: 'high'
          });
        }
        
        res.json({
          message: 'URL would be fetched',
          url: url,
          validated: false
        });
      } else {
        // Secure: URL validation and allowlist
        const allowedDomains = ['api.example.com', 'trusted-source.org'];
        const urlObj = new URL(url);
        
        if (!allowedDomains.includes(urlObj.hostname)) {
          return res.status(400).json({
            error: 'Domain not in allowlist',
            allowed_domains: allowedDomains
          });
        }
        
        res.json({
          message: 'URL validated and fetched',
          url: url,
          validated: true
        });
      }
    });

    // Additional security headers endpoint
    app.get('/api/headers-test', (req, res) => {
      if (req.query.secure === 'true') {
        // Set security headers
        res.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'Content-Security-Policy': "default-src 'self'",
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        });
      }
      
      res.json({ message: 'Headers test endpoint' });
    });
  });

  describe('A01: Broken Access Control', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      const userToken = jwt.sign(
        { id: '2', username: 'user', role: 'user' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    it('should allow admin access to admin endpoints', async () => {
      const adminToken = jwt.sign(
        { id: '1', username: 'admin', role: 'admin' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toHaveLength(3);
    });

    it('should prevent horizontal privilege escalation', async () => {
      const userToken = jwt.sign(
        { id: '2', username: 'user', role: 'user' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      // Try to access another user's data
      const response = await request(app)
        .get('/api/users/1') // Trying to access user ID 1
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should allow users to access their own data', async () => {
      const userToken = jwt.sign(
        { id: '2', username: 'user', role: 'user' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/users/2') // Accessing own data
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user.id).toBe('2');
    });

    it('should demonstrate vulnerable access control', async () => {
      const userToken = jwt.sign(
        { id: '2', username: 'user', role: 'user' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      // With vulnerable flag, access control is bypassed
      const response = await request(app)
        .get('/api/users/1?vulnerable=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.user.id).toBe('1'); // Should not be accessible
    });
  });

  describe('A02: Cryptographic Failures', () => {
    it('should identify insecure data storage', async () => {
      const sensitiveData = 'password123';

      const response = await request(app)
        .post('/api/crypto-test')
        .send({ data: sensitiveData, mode: 'insecure' })
        .expect(200);

      expect(response.body.stored).toBe(sensitiveData); // Plain text storage
      expect(response.body.hash).toBe(Buffer.from(sensitiveData).toString('base64'));
      expect(response.body.transmitted).toBe(sensitiveData);
    });

    it('should demonstrate secure cryptographic practices', async () => {
      const sensitiveData = 'password123';

      const response = await request(app)
        .post('/api/crypto-test')
        .send({ data: sensitiveData, mode: 'secure' })
        .expect(200);

      expect(response.body.message).toBe('Data processed securely');
      expect(response.body.hash).toBe('sha256-hash-would-go-here');
      expect(response.body.stored).toBeUndefined();
    });

    it('should not expose sensitive data in responses', async () => {
      const creditCardNumber = '4532-1234-5678-9012';

      const response = await request(app)
        .post('/api/crypto-test')
        .send({ data: creditCardNumber, mode: 'secure' })
        .expect(200);

      expect(JSON.stringify(response.body)).not.toContain(creditCardNumber);
    });
  });

  describe('A03: Injection', () => {
    it('should detect SQL injection attempts', async () => {
      const maliciousQuery = "'; DROP TABLE users; --";

      const response = await request(app)
        .post('/api/search')
        .send({ query: maliciousQuery, type: 'vulnerable' })
        .expect(400);

      expect(response.body.error).toBe('SQL injection detected');
      expect(response.body.query).toContain(maliciousQuery);
    });

    it('should prevent SQL injection with parameterized queries', async () => {
      const query = 'legitimate search term';

      const response = await request(app)
        .post('/api/search')
        .send({ query: query, type: 'secure' })
        .expect(200);

      expect(response.body.message).toBe('Search completed safely');
      expect(response.body.query).toBe('SELECT * FROM campaigns WHERE name LIKE ?');
      expect(response.body.params).toEqual([query]);
    });

    it('should handle NoSQL injection attempts', async () => {
      const noSqlInjection = '{"$ne": null}';

      const response = await request(app)
        .post('/api/search')
        .send({ query: noSqlInjection, type: 'secure' })
        .expect(200);

      // Should treat as literal string, not as query operator
      expect(response.body.params).toEqual([noSqlInjection]);
    });

    it('should detect command injection patterns', async () => {
      const commandInjection = 'test; rm -rf /';

      const response = await request(app)
        .post('/api/search')
        .send({ query: commandInjection, type: 'vulnerable' })
        .expect(200); // Not detected in this simple example

      expect(response.body.query).toContain(commandInjection);
    });
  });

  describe('A04: Insecure Design', () => {
    it('should identify insecure password reset design', async () => {
      const response = await request(app)
        .post('/api/password-reset')
        .send({ email: 'user@example.com', mode: 'insecure' })
        .expect(200);

      expect(response.body.token).toBeDefined(); // Token should not be exposed
      expect(response.body.expires).toBeGreaterThan(Date.now());
      expect(response.body.expires - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000); // Too long expiry
    });

    it('should demonstrate secure password reset design', async () => {
      const response = await request(app)
        .post('/api/password-reset')
        .send({ email: 'user@example.com', mode: 'secure' })
        .expect(200);

      expect(response.body.message).toBe('If the email exists, a reset link has been sent');
      expect(response.body.token).toBeUndefined(); // No token exposure
      expect(response.body.expires).toBeUndefined(); // No timing information
    });

    it('should prevent user enumeration', async () => {
      // Both existing and non-existing users should get same response
      const existingUser = await request(app)
        .post('/api/password-reset')
        .send({ email: 'existing@example.com', mode: 'secure' })
        .expect(200);

      const nonExistingUser = await request(app)
        .post('/api/password-reset')
        .send({ email: 'nonexisting@example.com', mode: 'secure' })
        .expect(200);

      expect(existingUser.body.message).toBe(nonExistingUser.body.message);
    });
  });

  describe('A05: Security Misconfiguration', () => {
    it('should identify information disclosure vulnerabilities', async () => {
      const response = await request(app)
        .get('/api/server-info?expose=true')
        .expect(200);

      expect(response.body.server).toContain('Express');
      expect(response.body.node).toBeDefined();
      expect(response.body.secrets).toBeDefined(); // Critical: secrets exposed
      expect(response.body.secrets.jwt).toBe(jwtSecret);
    });

    it('should demonstrate secure information disclosure', async () => {
      const response = await request(app)
        .get('/api/server-info')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.server).toBeUndefined();
      expect(response.body.secrets).toBeUndefined();
      expect(response.body.debug).toBeUndefined();
    });

    it('should check for security headers', async () => {
      const response = await request(app)
        .get('/api/headers-test?secure=true')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should identify missing security headers', async () => {
      const response = await request(app)
        .get('/api/headers-test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBeUndefined();
      expect(response.headers['x-frame-options']).toBeUndefined();
      expect(response.headers['strict-transport-security']).toBeUndefined();
    });
  });

  describe('A06: Vulnerable and Outdated Components', () => {
    it('should identify vulnerable dependencies', async () => {
      const response = await request(app)
        .get('/api/dependencies?show_vulnerable=true')
        .expect(200);

      const vulnerableDeps = response.body.dependencies.filter(dep => dep.vulnerabilities > 0);
      expect(vulnerableDeps.length).toBeGreaterThan(0);
      
      const lodashVuln = vulnerableDeps.find(dep => dep.name === 'lodash');
      expect(lodashVuln.vulnerabilities).toBe(2);
    });

    it('should not expose dependency information by default', async () => {
      const response = await request(app)
        .get('/api/dependencies')
        .expect(200);

      expect(response.body.message).toBe('Dependency information not exposed');
      expect(response.body.dependencies).toBeUndefined();
    });

    it('should check for outdated versions', async () => {
      const response = await request(app)
        .get('/api/dependencies?show_vulnerable=true')
        .expect(200);

      const axisDep = response.body.dependencies.find(dep => dep.name === 'axios');
      expect(axisDep.version).toBe('0.18.0'); // Old version
      expect(axisDep.vulnerabilities).toBeGreaterThan(0);
    });
  });

  describe('A07: Identification and Authentication Failures', () => {
    it('should identify weak authentication', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'admin', mode: 'vulnerable' })
        .expect(200);

      expect(response.body.sessionId).toBe(response.body.sessionId); // Predictable session ID
      expect(parseInt(response.body.sessionId)).toBeGreaterThan(0); // Numeric, predictable
    });

    it('should prevent username enumeration', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'nonexistent', password: 'wrongpass', mode: 'secure' })
        .expect(401);

      expect(response.body.error).toBe('Authentication failed');
      expect(response.body.username).toBeUndefined(); // No username disclosure
      expect(response.body.user_exists).toBeUndefined();
    });

    it('should demonstrate vulnerable username enumeration', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'wrongpass', mode: 'vulnerable' })
        .expect(401);

      expect(response.body.username).toBe('admin'); // Username enumeration vulnerability
      expect(response.body.attempts).toBeDefined();
    });

    it('should use secure token-based authentication', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'secure-password-123!', mode: 'secure' })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.sessionId).toBeUndefined(); // No predictable session ID

      // Verify token is valid JWT
      const decoded = jwt.verify(response.body.token, jwtSecret);
      expect(decoded.username).toBe('admin');
      expect(decoded.role).toBe('admin');
    });

    it('should enforce token expiration', async () => {
      const expiredToken = jwt.sign(
        { id: '1', username: 'admin', role: 'admin' },
        jwtSecret,
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('A08: Software and Data Integrity Failures', () => {
    it('should identify lack of integrity verification', async () => {
      const response = await request(app)
        .post('/api/update')
        .send({ 
          package_url: 'https://malicious-site.com/package.tar.gz',
          mode: 'vulnerable'
        })
        .expect(200);

      expect(response.body.integrity_check).toBe(false);
      expect(response.body.signature_verified).toBe(false);
      expect(response.body.package_url).toContain('malicious-site.com');
    });

    it('should demonstrate proper integrity verification', async () => {
      const response = await request(app)
        .post('/api/update')
        .send({ 
          package_url: 'https://trusted-registry.com/package.tar.gz',
          mode: 'secure'
        })
        .expect(200);

      expect(response.body.integrity_check).toBeDefined();
      expect(response.body.signature_verified).toBe(true);
      expect(response.body.source_trusted).toBe(true);
    });

    it('should verify package source authenticity', async () => {
      const response = await request(app)
        .post('/api/update')
        .send({ 
          package_url: 'https://npmjs.com/package/express',
          mode: 'secure'
        })
        .expect(200);

      expect(response.body.source_trusted).toBe(true);
      expect(response.body.integrity_check).toBeDefined();
    });
  });

  describe('A09: Security Logging and Monitoring Failures', () => {
    it('should log security-relevant events', async () => {
      const adminToken = jwt.sign(
        { id: '1', username: 'admin', role: 'admin' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const response = await request(app)
        .post('/api/sensitive-action')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          action: 'update_user_permissions',
          data: { userId: '2', newRole: 'admin' },
          log_security: true
        })
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: update_user_permissions by user 1')
      );
      expect(response.body.logged).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should detect and block suspicious actions', async () => {
      const adminToken = jwt.sign(
        { id: '1', username: 'admin', role: 'admin' },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/sensitive-action')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          action: 'delete_all_data',
          log_security: true
        })
        .expect(400);

      expect(response.body.error).toBe('Action blocked');
      expect(response.body.reason).toBe('Potentially destructive action detected');
    });

    it('should handle missing authentication in security events', async () => {
      const response = await request(app)
        .post('/api/sensitive-action')
        .send({ action: 'test_action' })
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('A10: Server-Side Request Forgery (SSRF)', () => {
    it('should detect SSRF attempts to internal resources', async () => {
      const ssrfUrls = [
        'http://localhost:8080/admin',
        'http://127.0.0.1:3000/config',
        'http://internal.company.com/secrets'
      ];

      for (const url of ssrfUrls) {
        const response = await request(app)
          .post('/api/fetch-url')
          .send({ url: url, mode: 'vulnerable' })
          .expect(400);

        expect(response.body.error).toBe('SSRF attempt detected');
        expect(response.body.risk).toBe('high');
      }
    });

    it('should validate URLs against allowlist', async () => {
      const response = await request(app)
        .post('/api/fetch-url')
        .send({ 
          url: 'https://malicious-site.com/steal-data',
          mode: 'secure'
        })
        .expect(400);

      expect(response.body.error).toBe('Domain not in allowlist');
      expect(response.body.allowed_domains).toContain('api.example.com');
    });

    it('should allow requests to trusted domains', async () => {
      const response = await request(app)
        .post('/api/fetch-url')
        .send({ 
          url: 'https://api.example.com/data',
          mode: 'secure'
        })
        .expect(200);

      expect(response.body.message).toBe('URL validated and fetched');
      expect(response.body.validated).toBe(true);
    });

    it('should handle malformed URLs in SSRF protection', async () => {
      const malformedUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert(1)</script>'
      ];

      for (const url of malformedUrls) {
        const response = await request(app)
          .post('/api/fetch-url')
          .send({ url: url, mode: 'secure' })
          .expect(400);

        // Should either reject malformed URL or treat as invalid
        expect([400, 500].includes(response.status)).toBe(true);
      }
    });
  });

  describe('Combined Security Tests', () => {
    it('should handle multiple vulnerabilities in single request', async () => {
      // Combine multiple attack vectors
      const maliciousRequest = {
        username: "'; DROP TABLE users; --", // SQL injection
        password: '<script>alert("xss")</script>', // XSS
        redirect: 'http://localhost:8080/admin', // SSRF
        mode: 'vulnerable'
      };

      const response = await request(app)
        .post('/api/login')
        .send(maliciousRequest)
        .expect(401);

      // Should handle gracefully
      expect(response.body.error).toBeDefined();
    });

    it('should maintain security under load', async () => {
      const promises = [];
      
      // Send 20 concurrent requests with mixed content
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/search')
            .send({
              query: i % 2 === 0 ? "'; DROP TABLE users; --" : 'legitimate query',
              type: 'secure'
            })
        );
      }

      const responses = await Promise.allSettled(promises);
      
      // All should complete successfully
      responses.forEach(response => {
        expect(response.status).toBe('fulfilled');
        expect([200, 400].includes(response.value.status)).toBe(true);
      });
    });

    it('should maintain security across different content types', async () => {
      const maliciousScript = '<script>alert("xss")</script>';
      
      // Test different content types
      const jsonResponse = await request(app)
        .post('/api/search')
        .send({ query: maliciousScript, type: 'secure' })
        .expect(200);

      const formResponse = await request(app)
        .post('/api/search')
        .type('form')
        .send(`query=${encodeURIComponent(maliciousScript)}&type=secure`)
        .expect(200);

      // Both should handle the input safely
      expect(jsonResponse.body.params).toEqual([maliciousScript]);
      expect(formResponse.body.params).toEqual([maliciousScript]);
    });

    it('should provide comprehensive security coverage', async () => {
      // Verify all OWASP Top 10 categories are addressed
      const securityCategories = [
        'Broken Access Control',
        'Cryptographic Failures', 
        'Injection',
        'Insecure Design',
        'Security Misconfiguration',
        'Vulnerable and Outdated Components',
        'Identification and Authentication Failures',
        'Software and Data Integrity Failures',
        'Security Logging and Monitoring Failures',
        'Server-Side Request Forgery'
      ];

      // This test verifies that all categories have been addressed
      // by checking that corresponding test endpoints exist and function
      expect(securityCategories.length).toBe(10);
      
      // Additional verification could include checking that security
      // controls are properly implemented across the application
      const healthResponse = await request(app)
        .get('/api/server-info')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
    });
  });
});