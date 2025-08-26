import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SupabaseService } from '../../services/supabaseService.js';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';

describe('Database Integration Tests - Fixed', () => {
  let supabaseService;
  let mockSupabaseClient;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn(),
        limit: jest.fn()
      }))
    };

    supabaseService = new SupabaseService();
    supabaseService.client = mockSupabaseClient;
  });

  describe('Connection Tests', () => {
    it('should test database connection successfully', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.limit.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse([{ count: 5 }])
      );

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle connection failures', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.limit.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Connection failed' })
      );

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should handle database exceptions', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.limit.mockRejectedValue(new Error('Database exception'));

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database exception');
    });
  });

  describe('Campaign Operations', () => {
    const mockCampaignData = TestHelpers.generateMockCampaignData();
    const mockCampaign = MockFactories.campaign(mockCampaignData);

    it('should create campaign successfully', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );

      const result = await supabaseService.createCampaign(mockCampaignData);

      expect(result).toEqual(mockCampaign);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('campaigns');
    });

    it('should handle campaign creation errors', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Insert failed' })
      );

      await expect(
        supabaseService.createCampaign(mockCampaignData)
      ).rejects.toThrow('Insert failed');
    });

    it('should get campaign successfully', async () => {
      const campaignId = mockCampaign.id;
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );

      const result = await supabaseService.getCampaign(campaignId);

      expect(result).toEqual(mockCampaign);
    });

    it('should handle non-existent campaign', async () => {
      const campaignId = 'non-existent-id';
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Not found' })
      );

      await expect(
        supabaseService.getCampaign(campaignId)
      ).rejects.toThrow('Not found');
    });
  });

  describe('KYC Operations', () => {
    const mockKYCData = TestHelpers.generateMockKYCData();
    const mockKYCRecord = MockFactories.kycRecord({
      wallet_address: mockKYCData.address.toLowerCase()
    });

    it('should create KYC record successfully', async () => {
      const mockChain = mockSupabaseClient.from('kyc_verifications');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );

      const result = await supabaseService.createKYCRecord(mockKYCData);

      expect(result).toEqual(mockKYCRecord);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('kyc_verifications');
    });

    it('should handle KYC creation errors', async () => {
      const mockChain = mockSupabaseClient.from('kyc_verifications');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Insert failed' })
      );

      await expect(
        supabaseService.createKYCRecord(mockKYCData)
      ).rejects.toThrow('Insert failed');
    });

    it('should get KYC status successfully', async () => {
      const walletAddress = mockKYCData.address;
      const mockChain = mockSupabaseClient.from('kyc_verifications');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockKYCRecord)
      );

      const result = await supabaseService.getKYCStatus(walletAddress);

      expect(result).toEqual(mockKYCRecord);
    });

    it('should handle non-existent KYC record gracefully', async () => {
      const walletAddress = mockKYCData.address;
      const mockChain = mockSupabaseClient.from('kyc_verifications');
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const result = await supabaseService.getKYCStatus(walletAddress);

      expect(result).toBeNull();
    });
  });

  describe('Contribution Operations', () => {
    const campaignId = '123e4567-e89b-12d3-a456-426614174000';
    const mockContributions = [
      MockFactories.formSubmission({ campaign_id: campaignId }),
      MockFactories.formSubmission({ campaign_id: campaignId })
    ];

    it('should get contributions successfully', async () => {
      const mockChain = mockSupabaseClient.from('form_submissions');
      mockChain.range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockContributions)
      );

      const result = await supabaseService.getContributions(campaignId);

      expect(result).toEqual(mockContributions);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('form_submissions');
    });

    it('should handle contributions query errors', async () => {
      const mockChain = mockSupabaseClient.from('form_submissions');
      mockChain.range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Query failed' })
      );

      await expect(
        supabaseService.getContributions(campaignId)
      ).rejects.toThrow('Query failed');
    });

    it('should handle empty contributions', async () => {
      const mockChain = mockSupabaseClient.from('form_submissions');
      mockChain.range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse([])
      );

      const result = await supabaseService.getContributions(campaignId);

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.limit.mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('ETIMEDOUT');
    });

    it('should handle authentication errors', async () => {
      const mockChain = mockSupabaseClient.from('campaigns');
      mockChain.limit.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { 
          code: 'PGRST301', 
          message: 'JWT expired' 
        })
      );

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('JWT expired');
    });
  });

  describe('Transaction Rollbacks and Error Scenarios', () => {
    it('should handle database transaction failures', async () => {
      const campaignData = TestHelpers.generateMockCampaignData();
      const mockChain = mockSupabaseClient.from('campaigns');
      
      // Simulate a transaction failure
      mockChain.single.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        supabaseService.createCampaign(campaignData)
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle concurrent modification errors', async () => {
      const campaignId = 'test-campaign-id';
      const updateData = { campaign_name: 'Updated Name' };
      const mockChain = mockSupabaseClient.from('campaigns');
      
      // Simulate optimistic locking failure
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { 
          code: '23505', 
          message: 'duplicate key value violates unique constraint' 
        })
      );

      await expect(
        supabaseService.updateCampaign(campaignId, updateData)
      ).rejects.toThrow('duplicate key value violates unique constraint');
    });

    it('should handle constraint violation errors', async () => {
      const invalidCampaignData = { 
        campaign_name: null, // Violates not-null constraint
        email: 'invalid-email'
      };
      const mockChain = mockSupabaseClient.from('campaigns');
      
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { 
          code: '23502', 
          message: 'null value in column "campaign_name" violates not-null constraint' 
        })
      );

      await expect(
        supabaseService.createCampaign(invalidCampaignData)
      ).rejects.toThrow('null value in column "campaign_name" violates not-null constraint');
    });
  });
});