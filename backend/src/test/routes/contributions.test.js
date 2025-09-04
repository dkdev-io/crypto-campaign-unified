import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import contributionsRouter from '../../routes/contributions.js';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';

// Mock the services
let mockSupabaseClient, mockWeb3Service;

beforeEach(() => {
  mockSupabaseClient = global.mockSupabaseClient;
  mockWeb3Service = {
    initialized: true,
    initialize: jest.fn(),
    getCampaignStats: jest.fn(),
    getContributorInfo: jest.fn(),
    canContribute: jest.fn(),
    getMaxContributionWei: jest.fn(),
    waitForTransaction: jest.fn(),
    getNetworkInfo: jest.fn(),
  };

  // Mock Web3Service module
  jest.unstable_mockModule('../../services/web3Service.js', () => ({
    default: jest.fn(() => mockWeb3Service),
  }));
});

describe('Contributions Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/contributions', contributionsRouter);
  });

  describe('GET /api/contributions/stats', () => {
    it('should return campaign statistics successfully', async () => {
      const mockStats = {
        totalContributions: 10,
        totalAmount: '5.5',
        contributorCount: 8,
      };
      const mockDbStats = [{ status: 'completed' }];

      mockWeb3Service.getCampaignStats.mockResolvedValue(mockStats);
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockDbStats));

      const response = await request(app).get('/api/contributions/stats').expect(200);

      expect(response.body).toMatchObject({
        ...mockStats,
        databaseRecords: 1,
      });
      expect(response.body.lastUpdated).toBeDefined();
    });

    it('should handle web3 service initialization failure', async () => {
      mockWeb3Service.initialize.mockRejectedValue(new Error('Web3 initialization failed'));
      mockWeb3Service.initialized = false;

      const response = await request(app).get('/api/contributions/stats').expect(500);

      expect(response.body.error).toBe('Failed to retrieve contribution statistics');
    });

    it('should handle database errors gracefully', async () => {
      const mockStats = { totalContributions: 5 };
      mockWeb3Service.getCampaignStats.mockResolvedValue(mockStats);
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .mockResolvedValue(
          TestHelpers.createMockSupabaseResponse(null, { message: 'Database error' })
        );

      const response = await request(app).get('/api/contributions/stats').expect(200);

      expect(response.body.databaseRecords).toBe(0);
      expect(response.body.totalContributions).toBe(5);
    });
  });

  describe('GET /api/contributions/contributor/:address', () => {
    const validAddress = TestHelpers.generateMockAddress();
    const mockContributorInfo = {
      totalContributed: '2.5',
      contributionCount: 3,
      isKYCVerified: true,
    };
    const mockHistory = [MockFactories.contributionLog()];

    it('should return contributor information successfully', async () => {
      mockWeb3Service.getContributorInfo.mockResolvedValue(mockContributorInfo);
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .order()
        .mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockHistory));

      const response = await request(app)
        .get(`/api/contributions/contributor/${validAddress}`)
        .expect(200);

      expect(response.body).toMatchObject({
        ...mockContributorInfo,
        history: mockHistory,
        historyCount: 1,
      });
    });

    it('should return 400 for invalid address format', async () => {
      const response = await request(app)
        .get('/api/contributions/contributor/invalid-address')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Invalid Ethereum address');
    });

    it('should handle web3 service errors', async () => {
      mockWeb3Service.getContributorInfo.mockRejectedValue(new Error('Contract error'));

      const response = await request(app)
        .get(`/api/contributions/contributor/${validAddress}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve contributor information');
    });

    it('should handle missing history gracefully', async () => {
      mockWeb3Service.getContributorInfo.mockResolvedValue(mockContributorInfo);
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .order()
        .mockResolvedValue(
          TestHelpers.createMockSupabaseResponse(null, { message: 'No records found' })
        );

      const response = await request(app)
        .get(`/api/contributions/contributor/${validAddress}`)
        .expect(200);

      expect(response.body.history).toEqual([]);
      expect(response.body.historyCount).toBe(0);
    });
  });

  describe('POST /api/contributions/check', () => {
    const validCheckData = {
      address: TestHelpers.generateMockAddress(),
      amount: 1.0,
    };

    it('should check contribution eligibility successfully', async () => {
      const mockEligibility = { canContribute: true, reason: 'Eligible' };
      const mockContributorInfo = { totalContributed: '1.5' };
      const mockMaxContribution = { maxWei: '10000000000000000000' };

      mockWeb3Service.canContribute.mockResolvedValue(mockEligibility);
      mockWeb3Service.getContributorInfo.mockResolvedValue(mockContributorInfo);
      mockWeb3Service.getMaxContributionWei.mockResolvedValue(mockMaxContribution);
      mockSupabaseClient
        .from()
        .insert()
        .mockResolvedValue(TestHelpers.createMockSupabaseResponse({ id: 1 }));

      const response = await request(app)
        .post('/api/contributions/check')
        .send(validCheckData)
        .expect(200);

      expect(response.body).toMatchObject({
        ...mockEligibility,
        contributorInfo: mockContributorInfo,
        maxContribution: mockMaxContribution,
      });
      expect(response.body.checkTimestamp).toBeDefined();
    });

    it('should return 400 for invalid address format', async () => {
      const invalidData = { ...validCheckData, address: 'invalid-address' };

      const response = await request(app)
        .post('/api/contributions/check')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid amount', async () => {
      const invalidData = { ...validCheckData, amount: -1 };

      const response = await request(app)
        .post('/api/contributions/check')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for amount too high', async () => {
      const invalidData = { ...validCheckData, amount: 15 };

      const response = await request(app)
        .post('/api/contributions/check')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle web3 service errors', async () => {
      mockWeb3Service.canContribute.mockRejectedValue(new Error('Contract error'));

      const response = await request(app)
        .post('/api/contributions/check')
        .send(validCheckData)
        .expect(500);

      expect(response.body.error).toBe('Failed to check contribution eligibility');
    });

    it('should continue on logging failure', async () => {
      const mockEligibility = { canContribute: false, reason: 'Limit exceeded' };
      mockWeb3Service.canContribute.mockResolvedValue(mockEligibility);
      mockWeb3Service.getContributorInfo.mockResolvedValue({});
      mockWeb3Service.getMaxContributionWei.mockResolvedValue({});
      mockSupabaseClient.from().insert().mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/contributions/check')
        .send(validCheckData)
        .expect(200);

      expect(response.body.canContribute).toBe(false);
    });
  });

  describe('GET /api/contributions/max-amount', () => {
    it('should return maximum contribution amount', async () => {
      const mockMaxContribution = {
        maxWei: '3300000000000000000',
        maxEth: '3.3',
      };

      mockWeb3Service.getMaxContributionWei.mockResolvedValue(mockMaxContribution);

      const response = await request(app).get('/api/contributions/max-amount').expect(200);

      expect(response.body).toMatchObject({
        ...mockMaxContribution,
        fecLimit: 3300,
        currency: 'USD',
      });
      expect(response.body.lastUpdated).toBeDefined();
    });

    it('should handle web3 service errors', async () => {
      mockWeb3Service.getMaxContributionWei.mockRejectedValue(new Error('Contract error'));

      const response = await request(app).get('/api/contributions/max-amount').expect(500);

      expect(response.body.error).toBe('Failed to retrieve maximum contribution amount');
    });
  });

  describe('POST /api/contributions/transaction/monitor', () => {
    const validTransactionData = {
      transactionHash: TestHelpers.generateMockTransactionHash(),
      contributorAddress: TestHelpers.generateMockAddress(),
      expectedAmount: '1.0',
    };

    it('should monitor transaction successfully', async () => {
      const mockReceipt = TestHelpers.createMockWeb3Receipt(
        true,
        validTransactionData.transactionHash
      );
      const mockLogRecord = MockFactories.contributionLog();

      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);
      mockSupabaseClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockLogRecord));

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send(validTransactionData)
        .expect(200);

      expect(response.body).toMatchObject({
        transactionHash: validTransactionData.transactionHash,
        success: true,
        logged: true,
      });
    });

    it('should return 400 for invalid transaction hash', async () => {
      const invalidData = { ...validTransactionData, transactionHash: 'invalid-hash' };

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle failed transactions', async () => {
      const mockReceipt = TestHelpers.createMockWeb3Receipt(false);
      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);
      mockSupabaseClient
        .from()
        .insert()
        .select()
        .single.mockResolvedValue(
          TestHelpers.createMockSupabaseResponse(
            MockFactories.contributionLog({ status: 'failed' })
          )
        );

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send(validTransactionData)
        .expect(200);

      expect(response.body.success).toBe(false);
    });

    it('should continue on logging failure', async () => {
      const mockReceipt = TestHelpers.createMockWeb3Receipt(true);
      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);
      mockSupabaseClient.from().insert().select().single.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send(validTransactionData)
        .expect(200);

      expect(response.body.logged).toBe(false);
    });
  });

  describe('GET /api/contributions/recent', () => {
    const mockContributions = [
      MockFactories.contributionLog(),
      MockFactories.contributionLog({ status: 'completed' }),
    ];

    it('should return recent contributions successfully', async () => {
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .order()
        .range.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockContributions));

      const response = await request(app).get('/api/contributions/recent').expect(200);

      expect(response.body).toMatchObject({
        contributions: mockContributions,
        count: 2,
        limit: 10,
        offset: 0,
      });
    });

    it('should handle custom limit and offset', async () => {
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .order()
        .range.mockResolvedValue(TestHelpers.createMockSupabaseResponse([mockContributions[0]]));

      const response = await request(app)
        .get('/api/contributions/recent?limit=1&offset=5')
        .expect(200);

      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(5);
      expect(response.body.count).toBe(1);
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const response = await request(app).get('/api/contributions/recent?limit=150').expect(400);

      expect(response.body.error).toBe('Limit cannot exceed 100');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .order()
        .range.mockRejectedValue(new Error('DB error'));

      const response = await request(app).get('/api/contributions/recent').expect(500);

      expect(response.body.error).toBe('Failed to retrieve recent contributions');
    });

    it('should handle empty results', async () => {
      mockSupabaseClient
        .from()
        .select()
        .eq()
        .order()
        .range.mockResolvedValue(TestHelpers.createMockSupabaseResponse([]));

      const response = await request(app).get('/api/contributions/recent').expect(200);

      expect(response.body.contributions).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/contributions/network', () => {
    it('should return network information successfully', async () => {
      const mockNetworkInfo = {
        network: 'localhost',
        chainId: 31337,
        blockNumber: 12345,
        gasPrice: '20000000000',
      };

      mockWeb3Service.getNetworkInfo.mockResolvedValue(mockNetworkInfo);

      const response = await request(app).get('/api/contributions/network').expect(200);

      expect(response.body).toEqual(mockNetworkInfo);
    });

    it('should handle web3 service errors', async () => {
      mockWeb3Service.getNetworkInfo.mockRejectedValue(new Error('Network error'));

      const response = await request(app).get('/api/contributions/network').expect(500);

      expect(response.body.error).toBe('Failed to retrieve network information');
    });
  });
});
