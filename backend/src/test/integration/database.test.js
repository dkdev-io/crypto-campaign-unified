import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SupabaseService } from '../../services/supabaseService.js';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';

// Mock the services
let mockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = global.mockSupabaseClient;
});

describe('Database Integration Tests', () => {
  let supabaseService;

  beforeEach(() => {
    supabaseService = new SupabaseService();
    supabaseService.client = mockSupabaseClient;
  });

  describe('Connection Tests', () => {
    it('should test database connection successfully', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.limit.mockResolvedValue(TestHelpers.createMockSupabaseResponse([{ count: 5 }]));

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('campaigns');
    });

    it('should handle connection failures', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.limit.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Connection failed' })
      );

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should handle database exceptions', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
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
      const mockChain = mockSupabaseClient.from();
      mockChain.insert.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockCampaign));

      const result = await supabaseService.createCampaign(mockCampaignData);

      expect(result).toEqual(mockCampaign);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('campaigns');
    });

    it('should handle campaign creation errors', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.insert.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Insert failed' })
      );

      await expect(supabaseService.createCampaign(mockCampaignData)).rejects.toThrow(
        'Insert failed'
      );
    });

    it('should get campaign successfully', async () => {
      const campaignId = mockCampaign.id;
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockCampaign));

      const result = await supabaseService.getCampaign(campaignId);

      expect(result).toEqual(mockCampaign);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('campaigns');
    });

    it('should handle non-existent campaign', async () => {
      const campaignId = 'non-existent-id';
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Not found' })
      );

      await expect(supabaseService.getCampaign(campaignId)).rejects.toThrow('Not found');
    });

    it('should update campaign successfully', async () => {
      const campaignId = mockCampaign.id;
      const updateData = { campaign_name: 'Updated Campaign' };
      const updatedCampaign = { ...mockCampaign, ...updateData };

      const mockChain = mockSupabaseClient.from();
      mockChain.update.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(updatedCampaign));

      const result = await supabaseService.updateCampaign(campaignId, updateData);

      expect(result).toEqual(updatedCampaign);
    });

    it('should handle campaign update errors', async () => {
      const campaignId = mockCampaign.id;
      const updateData = { campaign_name: 'Updated Campaign' };

      const mockChain = mockSupabaseClient.from();
      mockChain.update.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Update failed' })
      );

      await expect(supabaseService.updateCampaign(campaignId, updateData)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('Contribution Operations', () => {
    const campaignId = '123e4567-e89b-12d3-a456-426614174000';
    const mockContributions = [
      MockFactories.formSubmission({ campaign_id: campaignId }),
      MockFactories.formSubmission({ campaign_id: campaignId }),
    ];

    it('should get contributions successfully', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.order.mockReturnValue(mockChain);
      mockChain.range.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockContributions));

      const result = await supabaseService.getContributions(campaignId);

      expect(result).toEqual(mockContributions);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('form_submissions');
    });

    it('should handle contributions with custom limit and offset', async () => {
      const limit = 10;
      const offset = 5;
      const limitedContributions = [mockContributions[0]];

      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.order.mockReturnValue(mockChain);
      mockChain.range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(limitedContributions)
      );

      const result = await supabaseService.getContributions(campaignId, limit, offset);

      expect(result).toEqual(limitedContributions);
    });

    it('should handle contributions query errors', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.order.mockReturnValue(mockChain);
      mockChain.range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Query failed' })
      );

      await expect(supabaseService.getContributions(campaignId)).rejects.toThrow('Query failed');
    });

    it('should handle empty contributions', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.order.mockReturnValue(mockChain);
      mockChain.range.mockResolvedValue(TestHelpers.createMockSupabaseResponse([]));

      const result = await supabaseService.getContributions(campaignId);

      expect(result).toEqual([]);
    });
  });

  describe('KYC Operations', () => {
    const mockKYCData = TestHelpers.generateMockKYCData();
    const mockKYCRecord = MockFactories.kycRecord({
      wallet_address: mockKYCData.address.toLowerCase(),
    });

    it('should create KYC record successfully', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.insert.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockKYCRecord));

      const result = await supabaseService.createKYCRecord(mockKYCData);

      expect(result).toEqual(mockKYCRecord);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('kyc_verifications');
    });

    it('should handle KYC creation errors', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.insert.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Insert failed' })
      );

      await expect(supabaseService.createKYCRecord(mockKYCData)).rejects.toThrow('Insert failed');
    });

    it('should get KYC status successfully', async () => {
      const walletAddress = mockKYCData.address;
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockKYCRecord));

      const result = await supabaseService.getKYCStatus(walletAddress);

      expect(result).toEqual(mockKYCRecord);
    });

    it('should handle non-existent KYC record gracefully', async () => {
      const walletAddress = mockKYCData.address;
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const result = await supabaseService.getKYCStatus(walletAddress);

      expect(result).toBeNull();
    });

    it('should handle KYC status query errors', async () => {
      const walletAddress = mockKYCData.address;
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, {
          code: 'PGRST001',
          message: 'Permission denied',
        })
      );

      await expect(supabaseService.getKYCStatus(walletAddress)).rejects.toThrow(
        'Permission denied'
      );
    });

    it('should handle case-insensitive wallet address lookup', async () => {
      const walletAddress = mockKYCData.address.toUpperCase();
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(TestHelpers.createMockSupabaseResponse(mockKYCRecord));

      const result = await supabaseService.getKYCStatus(walletAddress);

      expect(result).toEqual(mockKYCRecord);
    });
  });

  describe('Transaction Handling', () => {
    it('should handle multiple database operations consistently', async () => {
      const campaignData = TestHelpers.generateMockCampaignData();
      const kycData = TestHelpers.generateMockKYCData();
      const mockCampaign = MockFactories.campaign(campaignData);
      const mockKYC = MockFactories.kycRecord(kycData);

      // Mock first call for campaign creation
      const mockChain1 = mockSupabaseClient.from();
      mockChain1.insert.mockReturnValue(mockChain1);
      mockChain1.select.mockReturnValue(mockChain1);
      mockChain1.single.mockResolvedValueOnce(TestHelpers.createMockSupabaseResponse(mockCampaign));

      // Mock second call for KYC creation
      const mockChain2 = mockSupabaseClient.from();
      mockChain2.insert.mockReturnValue(mockChain2);
      mockChain2.select.mockReturnValue(mockChain2);
      mockChain2.single.mockResolvedValueOnce(TestHelpers.createMockSupabaseResponse(mockKYC));

      const campaignResult = await supabaseService.createCampaign(campaignData);
      const kycResult = await supabaseService.createKYCRecord(kycData);

      expect(campaignResult).toEqual(mockCampaign);
      expect(kycResult).toEqual(mockKYC);
    });

    it('should handle partial failures gracefully', async () => {
      const campaignData = TestHelpers.generateMockCampaignData();
      const kycData = TestHelpers.generateMockKYCData();
      const mockCampaign = MockFactories.campaign(campaignData);

      // Mock successful campaign creation
      const mockChain1 = mockSupabaseClient.from();
      mockChain1.insert.mockReturnValue(mockChain1);
      mockChain1.select.mockReturnValue(mockChain1);
      mockChain1.single.mockResolvedValueOnce(TestHelpers.createMockSupabaseResponse(mockCampaign));

      // Mock failed KYC creation
      const mockChain2 = mockSupabaseClient.from();
      mockChain2.insert.mockReturnValue(mockChain2);
      mockChain2.select.mockReturnValue(mockChain2);
      mockChain2.single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(null, { message: 'KYC creation failed' })
      );

      const campaignResult = await supabaseService.createCampaign(campaignData);
      expect(campaignResult).toEqual(mockCampaign);

      await expect(supabaseService.createKYCRecord(kycData)).rejects.toThrow('KYC creation failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.limit.mockRejectedValue(new Error('ETIMEDOUT'));

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('ETIMEDOUT');
    });

    it('should handle authentication errors', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.limit.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, {
          code: 'PGRST301',
          message: 'JWT expired',
        })
      );

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('JWT expired');
    });

    it('should handle rate limiting errors', async () => {
      const mockChain = mockSupabaseClient.from();
      mockChain.select.mockReturnValue(mockChain);
      mockChain.limit.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, {
          code: '42P01',
          message: 'Rate limit exceeded',
        })
      );

      const result = await supabaseService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should handle malformed data errors', async () => {
      const invalidCampaignData = {
        campaign_name: null, // Invalid data
        email: 'not-an-email',
      };

      const mockChain = mockSupabaseClient.from();
      mockChain.insert.mockReturnValue(mockChain);
      mockChain.select.mockReturnValue(mockChain);
      mockChain.single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, {
          code: '23502',
          message: 'null value in column "campaign_name" violates not-null constraint',
        })
      );

      await expect(supabaseService.createCampaign(invalidCampaignData)).rejects.toThrow(
        'null value in column "campaign_name" violates not-null constraint'
      );
    });
  });
});
