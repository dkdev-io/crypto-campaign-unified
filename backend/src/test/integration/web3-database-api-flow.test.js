import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';
import contributionsRouter from '../../routes/contributions.js';

describe('Web3 → Database → API Integration Flow', () => {
  let app;
  let mockSupabaseClient;
  let mockWeb3Service;

  beforeEach(() => {
    // Setup mock Supabase client with proper chaining
    const createMockResponse = (data, error = null) => ({ data, error });

    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn(),
      })),
    };

    // Setup mock Web3 service
    mockWeb3Service = {
      initialized: true,
      initialize: jest.fn().mockResolvedValue(true),
      getCampaignStats: jest.fn(),
      getContributorInfo: jest.fn(),
      canContribute: jest.fn(),
      getMaxContributionWei: jest.fn(),
      waitForTransaction: jest.fn(),
      getNetworkInfo: jest.fn(),
      isKYCVerified: jest.fn(),
    };

    // Mock the services for the router
    jest.doMock('../../services/supabaseService.js', () => ({
      default: { client: mockSupabaseClient },
      SupabaseService: class {
        constructor() {
          this.client = mockSupabaseClient;
        }
      },
    }));

    jest.doMock('../../services/web3Service.js', () => ({
      default: mockWeb3Service,
    }));

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/contributions', contributionsRouter);
  });

  describe('Complete Donation Flow Integration', () => {
    const testAddress = TestHelpers.generateMockAddress();
    const testAmount = '1.5';
    const testTxHash = TestHelpers.generateMockTransactionHash();

    it('should handle complete donation flow: eligibility check → transaction → confirmation', async () => {
      // Step 1: Check contribution eligibility
      const mockEligibility = { canContribute: true, reason: 'Eligible' };
      const mockContributorInfo = {
        totalContributed: '0.5',
        contributionCount: 1,
        isKYCVerified: true,
      };
      const mockMaxContribution = {
        maxWei: '3300000000000000000', // 3.3 ETH
        maxEth: '3.3',
      };

      mockWeb3Service.canContribute.mockResolvedValue(mockEligibility);
      mockWeb3Service.getContributorInfo.mockResolvedValue(mockContributorInfo);
      mockWeb3Service.getMaxContributionWei.mockResolvedValue(mockMaxContribution);

      // Mock database logging for eligibility check
      const eligibilityChain = mockSupabaseClient.from('eligibility_checks');
      eligibilityChain.insert.mockReturnThis();
      eligibilityChain.insert().mockResolvedValue({
        data: { id: 1, address: testAddress, amount: testAmount },
        error: null,
      });

      const eligibilityResponse = await request(app)
        .post('/api/contributions/check')
        .send({ address: testAddress, amount: parseFloat(testAmount) })
        .expect(200);

      expect(eligibilityResponse.body.canContribute).toBe(true);
      expect(eligibilityResponse.body.contributorInfo).toEqual(mockContributorInfo);

      // Step 2: Submit transaction and monitor
      const mockReceipt = {
        success: true,
        transactionHash: testTxHash,
        blockNumber: 12345,
        gasUsed: 21000,
        effectiveGasPrice: '20000000000',
      };

      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);

      // Mock database logging for transaction
      const transactionChain = mockSupabaseClient.from('contribution_logs');
      transactionChain.insert.mockReturnThis();
      transactionChain.select.mockReturnThis();
      transactionChain.single.mockResolvedValue({
        data: MockFactories.contributionLog({
          transaction_hash: testTxHash,
          contributor_address: testAddress,
          amount_eth: testAmount,
          status: 'completed',
        }),
        error: null,
      });

      const transactionResponse = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send({
          transactionHash: testTxHash,
          contributorAddress: testAddress,
          expectedAmount: testAmount,
        })
        .expect(200);

      expect(transactionResponse.body.success).toBe(true);
      expect(transactionResponse.body.transactionHash).toBe(testTxHash);
      expect(transactionResponse.body.logged).toBe(true);

      // Step 3: Verify updated statistics
      const updatedStats = {
        totalContributions: 2,
        totalAmount: '2.0', // Previous 0.5 + new 1.5
        contributorCount: 1,
      };

      mockWeb3Service.getCampaignStats.mockResolvedValue(updatedStats);

      // Mock database stats query
      const statsChain = mockSupabaseClient.from('contribution_logs');
      statsChain.select.mockReturnThis();
      statsChain.eq.mockResolvedValue({
        data: [{ status: 'completed' }],
        error: null,
      });

      const statsResponse = await request(app).get('/api/contributions/stats').expect(200);

      expect(statsResponse.body.totalContributions).toBe(2);
      expect(statsResponse.body.totalAmount).toBe('2.0');
      expect(statsResponse.body.databaseRecords).toBe(1);
    });

    it('should handle failed transactions in the flow', async () => {
      // Mock failed transaction
      const failedReceipt = {
        success: false,
        transactionHash: testTxHash,
        blockNumber: 12345,
        gasUsed: 50000,
        effectiveGasPrice: '25000000000',
      };

      mockWeb3Service.waitForTransaction.mockResolvedValue(failedReceipt);

      // Mock database logging for failed transaction
      const transactionChain = mockSupabaseClient.from('contribution_logs');
      transactionChain.insert.mockReturnThis();
      transactionChain.select.mockReturnThis();
      transactionChain.single.mockResolvedValue({
        data: MockFactories.contributionLog({
          transaction_hash: testTxHash,
          status: 'failed',
        }),
        error: null,
      });

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send({
          transactionHash: testTxHash,
          contributorAddress: testAddress,
          expectedAmount: testAmount,
        })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.logged).toBe(true);
    });

    it('should handle ineligible contributions', async () => {
      const mockIneligibility = {
        canContribute: false,
        reason: 'Contribution limit exceeded',
      };

      mockWeb3Service.canContribute.mockResolvedValue(mockIneligibility);
      mockWeb3Service.getContributorInfo.mockResolvedValue({
        totalContributed: '3.0',
        contributionCount: 2,
        isKYCVerified: true,
      });
      mockWeb3Service.getMaxContributionWei.mockResolvedValue({
        maxWei: '3300000000000000000',
        maxEth: '3.3',
      });

      // Mock database logging
      const eligibilityChain = mockSupabaseClient.from('eligibility_checks');
      eligibilityChain.insert.mockResolvedValue({ data: { id: 1 }, error: null });

      const response = await request(app)
        .post('/api/contributions/check')
        .send({ address: testAddress, amount: 1.0 })
        .expect(200);

      expect(response.body.canContribute).toBe(false);
      expect(response.body.reason).toBe('Contribution limit exceeded');
    });
  });

  describe('Database Connection and Error Recovery', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock Web3 service success but database failure
      mockWeb3Service.getCampaignStats.mockResolvedValue({
        totalContributions: 5,
        totalAmount: '2.5',
        contributorCount: 3,
      });

      // Mock database error
      const statsChain = mockSupabaseClient.from('contribution_logs');
      statsChain.select.mockReturnThis();
      statsChain.eq.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });

      const response = await request(app).get('/api/contributions/stats').expect(200);

      // Should still return Web3 data even with DB failure
      expect(response.body.totalContributions).toBe(5);
      expect(response.body.databaseRecords).toBe(0);
    });

    it('should handle Web3 service failures with database fallback', async () => {
      // Mock Web3 service failure
      mockWeb3Service.getCampaignStats.mockRejectedValue(new Error('RPC endpoint unavailable'));
      mockWeb3Service.initialize.mockRejectedValue(new Error('Network error'));

      const response = await request(app).get('/api/contributions/stats').expect(500);

      expect(response.body.error).toBe('Failed to retrieve contribution statistics');
    });
  });

  describe('Blockchain Event Handling Simulation', () => {
    it('should simulate processing blockchain events', async () => {
      const eventData = {
        transactionHash: TestHelpers.generateMockTransactionHash(),
        contributor: TestHelpers.generateMockAddress(),
        amount: '1000000000000000000', // 1 ETH in wei
        blockNumber: 12345,
        logIndex: 0,
      };

      // Simulate blockchain event processing
      const mockReceipt = {
        success: true,
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
        gasUsed: 21000,
      };

      mockWeb3Service.waitForTransaction.mockResolvedValue(mockReceipt);

      // Mock database insert for event processing
      const eventChain = mockSupabaseClient.from('contribution_logs');
      eventChain.insert.mockReturnThis();
      eventChain.select.mockReturnThis();
      eventChain.single.mockResolvedValue({
        data: MockFactories.contributionLog({
          transaction_hash: eventData.transactionHash,
          contributor_address: eventData.contributor,
          amount_wei: eventData.amount,
          block_number: eventData.blockNumber,
          status: 'completed',
        }),
        error: null,
      });

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send({
          transactionHash: eventData.transactionHash,
          contributorAddress: eventData.contributor,
          expectedAmount: '1.0',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.blockNumber).toBe(eventData.blockNumber);
    });

    it('should handle duplicate event processing', async () => {
      const testTxHash = TestHelpers.generateMockTransactionHash();

      // Mock transaction already processed (database constraint error)
      const eventChain = mockSupabaseClient.from('contribution_logs');
      eventChain.insert.mockReturnThis();
      eventChain.select.mockReturnThis();
      eventChain.single.mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
        },
      });

      mockWeb3Service.waitForTransaction.mockResolvedValue({
        success: true,
        transactionHash: testTxHash,
        blockNumber: 12345,
        gasUsed: 21000,
      });

      const response = await request(app)
        .post('/api/contributions/transaction/monitor')
        .send({
          transactionHash: testTxHash,
          contributorAddress: TestHelpers.generateMockAddress(),
          expectedAmount: '1.0',
        })
        .expect(200);

      // Should still report success even if logging failed due to duplicate
      expect(response.body.success).toBe(true);
      expect(response.body.logged).toBe(false);
    });
  });

  describe('Network Information and Health Checks', () => {
    it('should provide network status information', async () => {
      const mockNetworkInfo = {
        network: 'localhost',
        chainId: 31337,
        blockNumber: 12345,
        gasPrice: '20000000000',
      };

      mockWeb3Service.getNetworkInfo.mockResolvedValue(mockNetworkInfo);

      const response = await request(app).get('/api/contributions/network').expect(200);

      expect(response.body).toEqual(mockNetworkInfo);
      expect(response.body.chainId).toBe(31337);
      expect(response.body.network).toBe('localhost');
    });

    it('should handle network connectivity issues', async () => {
      mockWeb3Service.getNetworkInfo.mockRejectedValue(new Error('Network timeout'));

      const response = await request(app).get('/api/contributions/network').expect(500);

      expect(response.body.error).toBe('Failed to retrieve network information');
    });
  });
});
