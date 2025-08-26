import { vi } from 'vitest';

// Mock campaign data
const mockCampaignData = {
  id: 'test-campaign-1',
  campaign_name: 'Test Campaign',
  email: 'test@example.com',
  candidate_name: 'John Doe',
  theme_color: '#2a2a72',
  suggested_amounts: [25, 50, 100, 250],
  max_donation_limit: 3300,
  website: 'https://test.com',
  wallet_address: '0x123...',
  created_at: '2024-01-01T00:00:00.000Z'
};

// Mock form submission data
const mockFormSubmission = {
  id: 'submission-1',
  campaign_id: 'test-campaign-1',
  donor_full_name: 'Jane Smith',
  donor_email: 'jane@example.com',
  amount_usd: 100,
  transaction_hash: '0xabc123...',
  created_at: '2024-01-01T12:00:00.000Z'
};

// Mock Supabase client
export const supabase = {
  from: vi.fn((table) => {
    const mockQuery = {
      select: vi.fn(() => mockQuery),
      insert: vi.fn(() => mockQuery),
      update: vi.fn(() => mockQuery),
      delete: vi.fn(() => mockQuery),
      eq: vi.fn(() => mockQuery),
      single: vi.fn(() => mockQuery),
      order: vi.fn(() => mockQuery),
      limit: vi.fn(() => mockQuery),
      range: vi.fn(() => mockQuery)
    };

    // Configure different responses based on table
    if (table === 'campaigns') {
      mockQuery.single.mockResolvedValue({
        data: mockCampaignData,
        error: null
      });
      
      mockQuery.select.mockImplementation(() => {
        mockQuery.single.mockResolvedValue({
          data: mockCampaignData,
          error: null
        });
        
        // For list queries without single()
        return {
          ...mockQuery,
          then: (resolve) => resolve({
            data: [mockCampaignData],
            error: null
          })
        };
      });

      mockQuery.insert.mockResolvedValue({
        data: [mockCampaignData],
        error: null
      });

      mockQuery.update.mockResolvedValue({
        data: [mockCampaignData],
        error: null
      });

      mockQuery.delete.mockResolvedValue({
        data: null,
        error: null
      });
    }

    if (table === 'form_submissions') {
      mockQuery.insert.mockResolvedValue({
        data: [mockFormSubmission],
        error: null
      });

      mockQuery.select.mockImplementation(() => ({
        ...mockQuery,
        then: (resolve) => resolve({
          data: [mockFormSubmission],
          error: null
        })
      }));
    }

    return mockQuery;
  }),

  // Mock auth methods
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    }))
  },

  // Mock storage methods
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn()
    }))
  },

  // Mock realtime
  channel: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  }))
};

// Export mock data for use in tests
export const mockData = {
  campaign: mockCampaignData,
  formSubmission: mockFormSubmission
};

// Helper to configure mock responses
export const configureSupabaseMock = {
  // Configure campaign loading success/failure
  setCampaignResponse: (data, error = null) => {
    supabase.from('campaigns').select().single.mockResolvedValue({ data, error });
  },

  // Configure form submission success/failure
  setSubmissionResponse: (data, error = null) => {
    supabase.from('form_submissions').insert().mockResolvedValue({ data: data ? [data] : null, error });
  },

  // Reset all mocks
  reset: () => {
    vi.clearAllMocks();
  }
};