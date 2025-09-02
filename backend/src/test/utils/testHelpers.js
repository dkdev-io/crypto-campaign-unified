import { jest } from '@jest/globals';

/**
 * Test helper utilities for API testing
 */
export class TestHelpers {
  static generateMockAddress() {
    return '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
  }

  static generateMockTransactionHash() {
    return '0x' + Math.random().toString(16).substring(2).padEnd(64, '0');
  }

  static generateMockKYCData(address = this.generateMockAddress()) {
    return {
      address,
      fullName: 'John Doe',
      email: 'john@dkdev.io',
      phone: '+1234567890',
      documentType: 'drivers_license',
      documentNumber: 'DL123456789',
      documentImages: ['image1.jpg', 'image2.jpg'],
      selfieImage: 'selfie.jpg'
    };
  }

  static generateMockCampaignData() {
    return {
      campaign_name: 'Test Campaign',
      email: 'campaign@dkdev.io',
      website: 'https://example.com',
      description: 'A test campaign'
    };
  }

  static generateMockContributionData(address = this.generateMockAddress()) {
    return {
      address,
      amount: '1.0'
    };
  }

  static createMockSupabaseResponse(data, error = null) {
    return {
      data,
      error,
      count: Array.isArray(data) ? data.length : (data ? 1 : 0)
    };
  }

  static createMockWeb3Receipt(success = true, transactionHash = this.generateMockTransactionHash()) {
    return {
      success,
      transactionHash,
      blockNumber: 12345,
      gasUsed: 21000,
      effectiveGasPrice: '20000000000',
      logs: []
    };
  }

  static setupExpressApp() {
    // Mock Express app for testing
    const mockApp = {
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      listen: jest.fn()
    };
    return mockApp;
  }

  static createMockRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      ...overrides
    };
  }

  static createMockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  }

  static createMockNext() {
    return jest.fn();
  }

  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mock factories for consistent test data
export const MockFactories = {
  campaign: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    campaign_name: 'Test Campaign',
    email: 'test@dkdev.io',
    website: 'https://example.com',
    setup_step: 1,
    setup_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  kycRecord: (overrides = {}) => ({
    id: '456e7890-e12b-34d5-a678-901234567890',
    wallet_address: TestHelpers.generateMockAddress().toLowerCase(),
    full_name: 'Jane Doe',
    email: 'jane@dkdev.io',
    phone: '+0987654321',
    document_type: 'passport',
    document_number: 'P123456789',
    status: 'pending',
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  contributionLog: (overrides = {}) => ({
    id: '789e0123-e45b-67d8-a901-234567890123',
    transaction_hash: TestHelpers.generateMockTransactionHash(),
    contributor_address: TestHelpers.generateMockAddress().toLowerCase(),
    amount_eth: '1.0',
    amount_wei: '1000000000000000000',
    block_number: 12345,
    status: 'completed',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  formSubmission: (overrides = {}) => ({
    id: '012e3456-e78b-90d1-a234-567890123456',
    campaign_id: '123e4567-e89b-12d3-a456-426614174000',
    donor_full_name: 'Bob Smith',
    amount_usd: 100,
    cryptocurrency: 'ETH',
    wallet_address: TestHelpers.generateMockAddress().toLowerCase(),
    transaction_hash: TestHelpers.generateMockTransactionHash(),
    created_at: new Date().toISOString(),
    ...overrides
  })
};

export default TestHelpers;