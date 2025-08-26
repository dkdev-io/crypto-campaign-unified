import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import campaignRouter from '../../routes/campaign.js';
import { TestHelpers, MockFactories } from '../utils/testHelpers.js';

// Mock the services
let mockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = global.mockSupabaseClient;
});

describe('Campaign Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/campaign', campaignRouter);
  });

  describe('GET /api/campaign/:id', () => {
    const campaignId = '123e4567-e89b-12d3-a456-426614174000';
    const mockCampaign = MockFactories.campaign({ id: campaignId });

    it('should return campaign details successfully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}`)
        .expect(200);

      // Should exclude sensitive fields
      expect(response.body.campaign).toBeDefined();
      expect(response.body.campaign.id).toBe(campaignId);
      expect(response.body.campaign.campaign_name).toBe(mockCampaign.campaign_name);
      expect(response.body.campaign.email).toBeUndefined();
      expect(response.body.campaign.setup_step).toBeUndefined();
      expect(response.body.campaign.terms_ip_address).toBeUndefined();
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/campaign/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].msg).toBe('Invalid campaign ID format');
    });

    it('should return 404 for non-existent campaign', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}`)
        .expect(404);

      expect(response.body.error).toBe('Campaign not found');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve campaign');
    });

    it('should handle non-PGRST116 database errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST001', message: 'Permission denied' })
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}`)
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve campaign');
    });
  });

  describe('POST /api/campaign', () => {
    const validCampaignData = TestHelpers.generateMockCampaignData();

    it('should create campaign successfully', async () => {
      const mockCreatedCampaign = MockFactories.campaign({
        ...validCampaignData,
        setup_step: 1,
        setup_completed: false
      });

      mockSupabaseClient.from().insert().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockCreatedCampaign)
      );

      const response = await request(app)
        .post('/api/campaign')
        .send(validCampaignData)
        .expect(201);

      expect(response.body.campaign).toBeDefined();
      expect(response.body.campaign.campaign_name).toBe(validCampaignData.campaign_name);
      expect(response.body.campaign.setup_step).toBe(1);
      expect(response.body.campaign.setup_completed).toBe(false);
      expect(response.body.message).toBe('Campaign created successfully');
    });

    it('should return 400 for missing campaign name', async () => {
      const invalidData = { ...validCampaignData };
      delete invalidData.campaign_name;

      const response = await request(app)
        .post('/api/campaign')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some(d => d.path === 'campaign_name')).toBe(true);
    });

    it('should return 400 for campaign name too short', async () => {
      const invalidData = { ...validCampaignData, campaign_name: 'A' };

      const response = await request(app)
        .post('/api/campaign')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for campaign name too long', async () => {
      const invalidData = { 
        ...validCampaignData, 
        campaign_name: 'A'.repeat(101) 
      };

      const response = await request(app)
        .post('/api/campaign')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validCampaignData, email: 'not-an-email' };

      const response = await request(app)
        .post('/api/campaign')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid website URL', async () => {
      const invalidData = { ...validCampaignData, website: 'not-a-url' };

      const response = await request(app)
        .post('/api/campaign')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle optional website field', async () => {
      const dataWithoutWebsite = { ...validCampaignData };
      delete dataWithoutWebsite.website;

      const mockCreatedCampaign = MockFactories.campaign(dataWithoutWebsite);
      mockSupabaseClient.from().insert().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockCreatedCampaign)
      );

      const response = await request(app)
        .post('/api/campaign')
        .send(dataWithoutWebsite)
        .expect(201);

      expect(response.body.campaign).toBeDefined();
    });

    it('should handle database insertion errors', async () => {
      mockSupabaseClient.from().insert().select().single.mockRejectedValue(
        new Error('Database insertion failed')
      );

      const response = await request(app)
        .post('/api/campaign')
        .send(validCampaignData)
        .expect(500);

      expect(response.body.error).toBe('Failed to create campaign');
    });
  });

  describe('PUT /api/campaign/:id', () => {
    const campaignId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      campaign_name: 'Updated Campaign',
      description: 'Updated description'
    };

    it('should update campaign successfully', async () => {
      const mockUpdatedCampaign = MockFactories.campaign({
        id: campaignId,
        ...updateData
      });

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockUpdatedCampaign)
      );

      const response = await request(app)
        .put(`/api/campaign/${campaignId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.campaign).toBeDefined();
      expect(response.body.campaign.campaign_name).toBe(updateData.campaign_name);
      expect(response.body.campaign.updated_at).toBeDefined();
      expect(response.body.message).toBe('Campaign updated successfully');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .put('/api/campaign/invalid-uuid')
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 for non-existent campaign', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const response = await request(app)
        .put(`/api/campaign/${campaignId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Campaign not found');
    });

    it('should handle database update errors', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockRejectedValue(
        new Error('Update failed')
      );

      const response = await request(app)
        .put(`/api/campaign/${campaignId}`)
        .send(updateData)
        .expect(500);

      expect(response.body.error).toBe('Failed to update campaign');
    });

    it('should handle non-PGRST116 database errors', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST001', message: 'Permission denied' })
      );

      const response = await request(app)
        .put(`/api/campaign/${campaignId}`)
        .send(updateData)
        .expect(500);

      expect(response.body.error).toBe('Failed to update campaign');
    });
  });

  describe('GET /api/campaign/:id/stats', () => {
    const campaignId = '123e4567-e89b-12d3-a456-426614174000';
    const mockCampaign = MockFactories.campaign({ id: campaignId });
    const mockContributions = [
      MockFactories.formSubmission({ campaign_id: campaignId, amount_usd: 100 }),
      MockFactories.formSubmission({ campaign_id: campaignId, amount_usd: 250 })
    ];

    it('should return campaign statistics successfully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );
      mockSupabaseClient.from().select().eq().mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(mockContributions)
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/stats`)
        .expect(200);

      expect(response.body).toMatchObject({
        campaignId,
        campaignName: mockCampaign.campaign_name,
        totalContributions: 2,
        totalAmount: 350,
        createdAt: mockCampaign.created_at
      });
      expect(response.body.lastContribution).toBeDefined();
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/campaign/invalid-uuid/stats')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 for non-existent campaign', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(null, { code: 'PGRST116' })
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/stats`)
        .expect(404);

      expect(response.body.error).toBe('Campaign not found');
    });

    it('should handle contributions fetch errors gracefully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );
      mockSupabaseClient.from().select().eq().mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(null, { message: 'Contributions error' })
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/stats`)
        .expect(200);

      expect(response.body.totalContributions).toBe(0);
      expect(response.body.totalAmount).toBe(0);
      expect(response.body.lastContribution).toBe(null);
    });

    it('should handle empty contributions', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );
      mockSupabaseClient.from().select().eq().mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse([])
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/stats`)
        .expect(200);

      expect(response.body.totalContributions).toBe(0);
      expect(response.body.totalAmount).toBe(0);
      expect(response.body.lastContribution).toBe(null);
    });

    it('should calculate last contribution timestamp correctly', async () => {
      const olderContribution = MockFactories.formSubmission({
        campaign_id: campaignId,
        created_at: '2024-01-01T00:00:00Z'
      });
      const newerContribution = MockFactories.formSubmission({
        campaign_id: campaignId,
        created_at: '2024-01-02T00:00:00Z'
      });

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse(mockCampaign)
      );
      mockSupabaseClient.from().select().eq().mockResolvedValueOnce(
        TestHelpers.createMockSupabaseResponse([olderContribution, newerContribution])
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/stats`)
        .expect(200);

      expect(response.body.lastContribution).toBe(
        new Date('2024-01-02T00:00:00Z').getTime()
      );
    });
  });

  describe('GET /api/campaign/:id/contributions', () => {
    const campaignId = '123e4567-e89b-12d3-a456-426614174000';
    const mockContributions = [
      MockFactories.formSubmission({ campaign_id: campaignId }),
      MockFactories.formSubmission({ campaign_id: campaignId })
    ];

    it('should return campaign contributions successfully', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockContributions)
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/contributions`)
        .expect(200);

      expect(response.body).toMatchObject({
        contributions: mockContributions,
        count: 2,
        limit: 50,
        offset: 0
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/campaign/invalid-uuid/contributions')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle custom limit and offset', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse([mockContributions[0]])
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/contributions?limit=1&offset=5`)
        .expect(200);

      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(5);
      expect(response.body.count).toBe(1);
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const response = await request(app)
        .get(`/api/campaign/${campaignId}/contributions?limit=150`)
        .expect(400);

      expect(response.body.error).toBe('Limit cannot exceed 100');
    });

    it('should handle empty contributions', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse([])
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/contributions`)
        .expect(200);

      expect(response.body.contributions).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/contributions`)
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve campaign contributions');
    });

    it('should handle non-integer limit and offset', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue(
        TestHelpers.createMockSupabaseResponse(mockContributions)
      );

      const response = await request(app)
        .get(`/api/campaign/${campaignId}/contributions?limit=abc&offset=xyz`)
        .expect(200);

      expect(response.body.limit).toBe(50); // Default value
      expect(response.body.offset).toBe(0); // Default value
    });
  });
});