import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import kycRouter from '../../routes/kyc.js';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';

// Mock the services
let mockSupabaseClient, mockWeb3Service;

beforeEach(() => {
  mockSupabaseClient = global.mockSupabaseClient;
  mockWeb3Service = {
    initialized: true,
    initialize: jest.fn(),
    isKYCVerified: jest.fn()
  };
  
  // Mock Web3Service module
  jest.unstable_mockModule('../../services/web3Service.js', () => ({
    default: jest.fn(() => mockWeb3Service)
  }));
});

describe('KYC Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/kyc', kycRouter);
  });

  describe('GET /api/kyc/status/:address', () => {
    const validAddress = TestHelpers.generateMockAddress();
    const mockKYCRecord = MockFactories.kycRecord({ status: 'approved' });

    it('should return KYC status successfully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );
      mockWeb3Service.isKYCVerified.mockResolvedValue(true);

      const response = await request(app)
        .get(`/api/kyc/status/${validAddress}`)
        .expect(200);

      expect(response.body).toMatchObject({
        address: validAddress,
        isVerified: true,
        onChainVerified: true,
        databaseStatus: 'approved'
      });
      expect(response.body.submissionDate).toBeDefined();
      expect(response.body.lastUpdated).toBeDefined();
    });

    it('should return 400 for invalid address format', async () => {
      const response = await request(app)
        .get('/api/kyc/status/invalid-address')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Invalid Ethereum address format');
    });

    it('should handle non-existent KYC records', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );
      mockWeb3Service.isKYCVerified.mockResolvedValue(false);

      const response = await request(app)
        .get(`/api/kyc/status/${validAddress}`)
        .expect(200);

      expect(response.body).toMatchObject({
        address: validAddress,
        isVerified: false,
        onChainVerified: false,
        databaseStatus: 'not_submitted',
        submissionDate: null,
        lastUpdated: null
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST001', message: 'Database error' })
      );
      mockWeb3Service.isKYCVerified.mockResolvedValue(false);

      const response = await request(app)
        .get(`/api/kyc/status/${validAddress}`)
        .expect(200);

      expect(response.body.databaseStatus).toBe('not_submitted');
      expect(response.body.onChainVerified).toBe(false);
    });

    it('should handle Web3 service errors gracefully', async () => {
      const mockKYCRecord = MockFactories.kycRecord({ status: 'pending' });
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );
      mockWeb3Service.isKYCVerified.mockRejectedValue(new Error('Web3 error'));

      const response = await request(app)
        .get(`/api/kyc/status/${validAddress}`)
        .expect(200);

      expect(response.body.isVerified).toBe(false);
      expect(response.body.onChainVerified).toBe(false);
      expect(response.body.databaseStatus).toBe('pending');
    });

    it('should consider database approval as verified when on-chain fails', async () => {
      const mockKYCRecord = MockFactories.kycRecord({ status: 'approved' });
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );
      mockWeb3Service.isKYCVerified.mockRejectedValue(new Error('Web3 error'));

      const response = await request(app)
        .get(`/api/kyc/status/${validAddress}`)
        .expect(200);

      expect(response.body.isVerified).toBe(true);
      expect(response.body.onChainVerified).toBe(false);
      expect(response.body.databaseStatus).toBe('approved');
    });
  });

  describe('POST /api/kyc/submit', () => {
    const validKYCData = TestHelpers.generateMockKYCData();

    it('should submit KYC information successfully for new user', async () => {
      // No existing KYC record
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );
      
      // Successful insertion
      const mockCreatedRecord = MockFactories.kycRecord({
        wallet_address: validKYCData.address.toLowerCase()
      });
      mockSupabaseClient.from().insert().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockCreatedRecord)
      );

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(validKYCData)
        .expect(201);

      expect(response.body).toMatchObject({
        kycId: mockCreatedRecord.id,
        status: 'pending',
        message: 'KYC submission received and is being processed',
        estimatedProcessingTime: '24-48 hours'
      });
    });

    it('should update existing KYC submission', async () => {
      const existingKYC = MockFactories.kycRecord({ status: 'rejected' });
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(existingKYC)
      );
      
      const updatedRecord = { ...existingKYC, status: 'pending' };
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(updatedRecord)
      );

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(validKYCData)
        .expect(201);

      expect(response.body.kycId).toBe(existingKYC.id);
      expect(response.body.status).toBe('pending');
    });

    it('should return 400 if KYC already approved', async () => {
      const approvedKYC = MockFactories.kycRecord({ status: 'approved' });
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(approvedKYC)
      );

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(validKYCData)
        .expect(400);

      expect(response.body.error).toBe('KYC already approved for this address');
    });

    it('should return 400 for invalid address format', async () => {
      const invalidData = { ...validKYCData, address: 'invalid-address' };

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { ...validKYCData };
      delete invalidData.fullName;

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validKYCData, email: 'not-an-email' };

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid document type', async () => {
      const invalidData = { ...validKYCData, documentType: 'invalid_type' };

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle database insertion errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );
      mockSupabaseClient.from().insert().select().single.mockRejectedValue(
        new Error('Database insertion failed')
      );

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(validKYCData)
        .expect(500);

      expect(response.body.error).toBe('Failed to submit KYC verification');
    });

    it('should handle database check errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockRejectedValue(
        new Error('Database check failed')
      );

      const response = await request(app)
        .post('/api/kyc/submit')
        .send(validKYCData)
        .expect(500);

      expect(response.body.error).toBe('Failed to submit KYC verification');
    });
  });

  describe('PUT /api/kyc/:id/approve', () => {
    const kycId = '123e4567-e89b-12d3-a456-426614174000';
    const mockKYCRecord = MockFactories.kycRecord({ id: kycId, status: 'pending' });

    it('should approve KYC successfully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );
      
      const approvedRecord = { ...mockKYCRecord, status: 'approved' };
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(approvedRecord)
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/approve`)
        .send({ approved_by: 'admin' })
        .expect(200);

      expect(response.body).toMatchObject({
        kycId,
        status: 'approved',
        address: mockKYCRecord.wallet_address,
        message: 'KYC verification approved'
      });
    });

    it('should return 404 for non-existent KYC record', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/approve`)
        .send({ approved_by: 'admin' })
        .expect(404);

      expect(response.body.error).toBe('KYC record not found');
    });

    it('should return 400 if KYC already approved', async () => {
      const approvedKYC = MockFactories.kycRecord({ id: kycId, status: 'approved' });
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(approvedKYC)
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/approve`)
        .send({ approved_by: 'admin' })
        .expect(400);

      expect(response.body.error).toBe('KYC already approved');
    });

    it('should handle database update errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );
      mockSupabaseClient.from().update().eq().select().single.mockRejectedValue(
        new Error('Update failed')
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/approve`)
        .send({ approved_by: 'admin' })
        .expect(500);

      expect(response.body.error).toBe('Failed to approve KYC verification');
    });
  });

  describe('PUT /api/kyc/:id/reject', () => {
    const kycId = '123e4567-e89b-12d3-a456-426614174000';
    const rejectionData = {
      reason: 'Invalid documents',
      rejected_by: 'admin'
    };

    it('should reject KYC successfully', async () => {
      const rejectedRecord = MockFactories.kycRecord({
        id: kycId,
        status: 'rejected',
        rejection_reason: rejectionData.reason
      });
      
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(rejectedRecord)
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/reject`)
        .send(rejectionData)
        .expect(200);

      expect(response.body).toMatchObject({
        kycId,
        status: 'rejected',
        reason: rejectionData.reason,
        message: 'KYC verification rejected'
      });
    });

    it('should return 404 for non-existent KYC record', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/reject`)
        .send(rejectionData)
        .expect(404);

      expect(response.body.error).toBe('KYC record not found');
    });

    it('should handle database update errors', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockRejectedValue(
        new Error('Update failed')
      );

      const response = await request(app)
        .put(`/api/kyc/${kycId}/reject`)
        .send(rejectionData)
        .expect(500);

      expect(response.body.error).toBe('Failed to reject KYC verification');
    });
  });

  describe('GET /api/kyc/pending', () => {
    const mockPendingKYCs = [
      MockFactories.kycRecord({ status: 'pending' }),
      MockFactories.kycRecord({ status: 'pending' })
    ];

    it('should return pending KYC verifications successfully', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockPendingKYCs)
      );

      const response = await request(app)
        .get('/api/kyc/pending')
        .expect(200);

      expect(response.body).toMatchObject({
        pending: mockPendingKYCs,
        count: 2,
        limit: 50,
        offset: 0
      });
    });

    it('should handle custom limit and offset', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse([mockPendingKYCs[0]])
      );

      const response = await request(app)
        .get('/api/kyc/pending?limit=1&offset=10')
        .expect(200);

      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(10);
    });

    it('should handle empty results', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse([])
      );

      const response = await request(app)
        .get('/api/kyc/pending')
        .expect(200);

      expect(response.body.pending).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/kyc/pending')
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve pending KYC verifications');
    });
  });
});