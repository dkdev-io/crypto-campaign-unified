import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import webhooksRouter from '../../routes/webhooks.js';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';

// Mock the services
let mockSupabaseClient, mockWeb3Service;

beforeEach(() => {
  mockSupabaseClient = global.mockSupabaseClient;
  mockWeb3Service = {
    initialized: true,
    initialize: jest.fn(),
    waitForTransaction: jest.fn(),
  };

  // Mock Web3Service module
  jest.unstable_mockModule('../../services/web3Service.js', () => ({
    default: jest.fn(() => mockWeb3Service),
  }));
});

describe('Webhooks Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/webhooks', webhooksRouter);
  });

  describe('POST /api/webhooks/blockchain/contribution', () => {
    const validWebhookData = {
      transactionHash: TestHelpers.generateMockTransactionHash(),
      blockNumber: 12345,
      from: TestHelpers.generateMockAddress(),
      to: TestHelpers.generateMockAddress(),
      value: '1000000000000000000', // 1 ETH in wei
      gasUsed: '21000',
      effectiveGasPrice: '20000000000',
      status: 'success',
    };

    it('should process blockchain contribution webhook successfully', async () => {
      const mockReceipt = TestHelpers.createMockWeb3Receipt(true, validWebhookData.transactionHash);
      const mockLogRecord = MockFactories.contributionLog();

      // Mock no existing transaction
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce(
          TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
        );

      // Mock successful transaction monitoring
      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);

      // Mock successful logging
      mockSupabaseClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce(TestHelpers.createMockSupabaseResponse(mockLogRecord));

      // Mock form submission search
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValueOnce(
          TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
        );

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Contribution webhook processed successfully',
        logId: mockLogRecord.id,
        transactionHash: validWebhookData.transactionHash,
        matchedSubmission: false,
      });
    });

    it('should return 400 for invalid transaction hash format', async () => {
      const invalidData = { ...validWebhookData, transactionHash: 'invalid-hash' };

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid block number', async () => {
      const invalidData = { ...validWebhookData, blockNumber: -1 };

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid from address', async () => {
      const invalidData = { ...validWebhookData, from: 'invalid-address' };

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid to address', async () => {
      const invalidData = { ...validWebhookData, to: 'invalid-address' };

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for non-string value', async () => {
      const invalidData = { ...validWebhookData, value: 123 };

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for failed transaction on blockchain', async () => {
      const mockFailedReceipt = TestHelpers.createMockWeb3Receipt(false);
      mockWeb3Service.waitForTransaction.mockResolvedValue(mockFailedReceipt);

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(400);

      expect(response.body.error).toBe('Transaction failed on blockchain');
    });

    it('should handle already processed transactions', async () => {
      const existingLog = MockFactories.contributionLog();
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(existingLog));

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(200);

      expect(response.body.message).toBe('Transaction already processed');
      expect(response.body.transactionHash).toBe(validWebhookData.transactionHash);
    });

    it('should match with existing form submission', async () => {
      const mockReceipt = TestHelpers.createMockWeb3Receipt(true);
      const mockLogRecord = MockFactories.contributionLog();
      const mockFormSubmission = MockFactories.formSubmission({
        wallet_address: validWebhookData.from.toLowerCase(),
        transaction_hash: validWebhookData.transactionHash,
      });

      mockSupabaseClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce(
          TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
        );
      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);
      mockSupabaseClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValueOnce(TestHelpers.createMockSupabaseResponse(mockLogRecord));
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .eq()
        .single.mockResolvedValueOnce(TestHelpers.createMockSupabaseResponse(mockFormSubmission));

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(200);

      expect(response.body.matchedSubmission).toBe(true);
    });

    it('should continue on logging failure', async () => {
      const mockReceipt = TestHelpers.createMockWeb3Receipt(true);
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce(
          TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
        );
      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);
      mockSupabaseClient
        .from()
        .insert()
        .select()
        .single.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(500);

      expect(response.body.error).toBe('Failed to process blockchain contribution webhook');
    });

    it('should handle web3 service errors', async () => {
      mockWeb3Service.waitForTransaction.mockRejectedValue(new Error('Web3 error'));

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(500);

      expect(response.body.error).toBe('Failed to process blockchain contribution webhook');
    });

    it('should handle database check errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/webhooks/blockchain/contribution')
        .send(validWebhookData)
        .expect(500);

      expect(response.body.error).toBe('Failed to process blockchain contribution webhook');
    });
  });

  describe('POST /api/webhooks/kyc/status', () => {
    const validKYCWebhookData = {
      address: TestHelpers.generateMockAddress(),
      status: 'approved',
      kycId: 'kyc-123456',
      reason: 'Documents verified',
      documents: ['passport', 'utility_bill'],
      metadata: { verifier: 'external_service', confidence: 0.95 },
    };

    it('should process KYC approval webhook successfully', async () => {
      const mockUpdatedKYC = MockFactories.kycRecord({
        wallet_address: validKYCWebhookData.address.toLowerCase(),
        status: 'approved',
      });

      mockWeb3Service.initialize.mockResolvedValue();
      mockSupabaseClient
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockUpdatedKYC));

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(validKYCWebhookData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'KYC webhook processed successfully',
        kycId: mockUpdatedKYC.id,
        address: validKYCWebhookData.address,
        status: 'approved',
      });
    });

    it('should process KYC rejection webhook successfully', async () => {
      const rejectionData = {
        ...validKYCWebhookData,
        status: 'rejected',
        reason: 'Invalid documents',
      };

      const mockUpdatedKYC = MockFactories.kycRecord({
        wallet_address: rejectionData.address.toLowerCase(),
        status: 'rejected',
      });

      mockSupabaseClient
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockUpdatedKYC));

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(rejectionData)
        .expect(200);

      expect(response.body.status).toBe('rejected');
    });

    it('should return 400 for invalid address format', async () => {
      const invalidData = { ...validKYCWebhookData, address: 'invalid-address' };

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid status', async () => {
      const invalidData = { ...validKYCWebhookData, status: 'invalid-status' };

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing KYC ID', async () => {
      const invalidData = { ...validKYCWebhookData };
      delete invalidData.kycId;

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 for non-existent KYC record', async () => {
      mockSupabaseClient
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockResolvedValue(
          TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
        );

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(validKYCWebhookData)
        .expect(404);

      expect(response.body.error).toBe('KYC record not found');
    });

    it('should handle database update errors', async () => {
      mockSupabaseClient
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(validKYCWebhookData)
        .expect(500);

      expect(response.body.error).toBe('Failed to process KYC status webhook');
    });

    it('should handle web3 initialization errors for approved KYC', async () => {
      const mockUpdatedKYC = MockFactories.kycRecord({ status: 'approved' });
      mockSupabaseClient
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockUpdatedKYC));
      mockWeb3Service.initialize.mockRejectedValue(new Error('Web3 error'));

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(validKYCWebhookData)
        .expect(200);

      expect(response.body.status).toBe('approved');
    });

    it('should handle pending status updates', async () => {
      const pendingData = {
        ...validKYCWebhookData,
        status: 'pending',
      };

      const mockUpdatedKYC = MockFactories.kycRecord({ status: 'pending' });
      mockSupabaseClient
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockUpdatedKYC));

      const response = await request(app)
        .post('/api/webhooks/kyc/status')
        .send(pendingData)
        .expect(200);

      expect(response.body.status).toBe('pending');
    });
  });

  describe('POST /api/webhooks/plaid/bank-verification', () => {
    const validPlaidWebhookData = {
      item_id: 'item-123456',
      webhook_type: 'ITEM',
      webhook_code: 'WEBHOOK_UPDATE_ACKNOWLEDGED',
      new_webhook_url: 'https://example.com/webhook',
    };

    it('should process Plaid webhook update acknowledgment successfully', async () => {
      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(validPlaidWebhookData)
        .expect(200);

      expect(response.body.message).toBe('Plaid webhook processed successfully');
    });

    it('should handle Plaid item errors', async () => {
      const errorData = {
        ...validPlaidWebhookData,
        webhook_code: 'ERROR',
        error: {
          error_type: 'ITEM_ERROR',
          error_code: 'INVALID_CREDENTIALS',
          display_message: 'The credentials provided were invalid',
        },
      };

      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(errorData)
        .expect(200);

      expect(response.body.message).toBe('Plaid webhook processed successfully');
    });

    it('should handle Plaid item pending expiration', async () => {
      const expirationData = {
        ...validPlaidWebhookData,
        webhook_code: 'PENDING_EXPIRATION',
      };

      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(expirationData)
        .expect(200);

      expect(response.body.message).toBe('Plaid webhook processed successfully');
    });

    it('should handle Auth webhook for automatic verification', async () => {
      const authData = {
        ...validPlaidWebhookData,
        webhook_type: 'AUTH',
        webhook_code: 'AUTOMATICALLY_VERIFIED',
      };

      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(authData)
        .expect(200);

      expect(response.body.message).toBe('Plaid webhook processed successfully');
    });

    it('should handle Auth webhook for verification expiration', async () => {
      const expiredData = {
        ...validPlaidWebhookData,
        webhook_type: 'AUTH',
        webhook_code: 'VERIFICATION_EXPIRED',
      };

      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(expiredData)
        .expect(200);

      expect(response.body.message).toBe('Plaid webhook processed successfully');
    });

    it('should handle unknown webhook types and codes', async () => {
      const unknownData = {
        ...validPlaidWebhookData,
        webhook_type: 'UNKNOWN_TYPE',
        webhook_code: 'UNKNOWN_CODE',
      };

      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(unknownData)
        .expect(200);

      expect(response.body.message).toBe('Plaid webhook processed successfully');
    });

    it('should handle processing errors', async () => {
      // Mock an error in the processing
      jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Processing error');
      });

      const response = await request(app)
        .post('/api/webhooks/plaid/bank-verification')
        .send(validPlaidWebhookData)
        .expect(500);

      expect(response.body.error).toBe('Failed to process Plaid webhook');

      // Restore console.log
      console.log.mockRestore();
    });
  });

  describe('GET /api/webhooks/health', () => {
    it('should return webhook health status', async () => {
      const response = await request(app).get('/api/webhooks/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        webhookTypes: ['blockchain/contribution', 'kyc/status', 'plaid/bank-verification'],
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
