import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock supabase client
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
};

// Mock ethers
export const mockEthers = {
  Contract: vi.fn(() => ({
    contribute: vi.fn().mockResolvedValue({
      hash: '0x1234567890abcdef',
      wait: vi.fn().mockResolvedValue({
        blockNumber: 12345,
        gasUsed: { toString: () => '21000' },
        transactionHash: '0x1234567890abcdef',
      }),
    })),
    contributionLimits: vi.fn().mockResolvedValue(['3300000000000000000000']),
    getTotalContributions: vi.fn().mockResolvedValue('0'),
  })),
  BrowserProvider: vi.fn(() => ({
    getSigner: vi.fn().mockResolvedValue({
      getAddress: vi.fn().mockResolvedValue('0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8'),
      signMessage: vi.fn().mockResolvedValue('0xsignature'),
    }),
  })),
  formatUnits: vi.fn((value) => value),
  parseUnits: vi.fn((value) => value),
  isAddress: vi.fn(() => true),
};

// Mock Web3 wallet connection
export const mockWeb3 = {
  ethereum: {
    isMetaMask: true,
    request: vi.fn().mockResolvedValue(['0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8']),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  connectWallet: vi.fn().mockResolvedValue({
    address: '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8',
    provider: mockEthers.BrowserProvider(),
  }),
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const AllTheProviders = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Setup user events
export const setupUser = () => userEvent.setup();

// Common test data
export const testCampaignData = {
  id: 'test-campaign-123',
  campaign_name: 'Test Campaign',
  email: 'test@example.com',
  website: 'https://testcampaign.com',
  wallet_address: '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8',
  fec_committee_id: 'C00123456',
  committee_name: 'Test Committee',
  suggested_amounts: [25, 50, 100, 250],
  max_donation_limit: 3300,
  theme_color: '#2a2a72',
  supported_cryptos: ['ETH'],
  setup_completed: false,
  setup_step: 1,
};

export const testDonorData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  occupation: 'Software Engineer',
  employer: 'Tech Corp',
  amount: 100,
  acknowledgmentSigned: true,
  walletAddress: '0x742d35cc6e4c43b3b5132b6c7e5c85b4a6b8b6a8',
};

export const testCommitteeData = {
  committee_id: 'C00123456',
  committee_name: 'Test Committee',
  committee_type_full: 'Principal Campaign Committee',
  candidate_name: 'Test Candidate',
  party_full: 'Democratic Party',
  state: 'CA',
  filing_frequency: 'Monthly',
  treasurer_name: 'Jane Smith',
};

// Mock API responses
export const mockApiResponses = {
  success: { data: testCampaignData, error: null },
  error: { data: null, error: { message: 'Test error' } },
  loading: { data: null, error: null, isLoading: true },
};

// Utility functions for testing async operations
export const waitForLoadingToFinish = async () => {
  await screen.findByText(/loading/i, {}, { timeout: 3000 }).then(
    () => {},
    () => {} // Ignore if not found
  );
};

export const expectElementToBeInDocument = (text) => {
  expect(screen.getByText(text)).toBeInTheDocument();
};

export const expectElementNotToBeInDocument = (text) => {
  expect(screen.queryByText(text)).not.toBeInTheDocument();
};

// Form validation helpers
export const fillFormField = async (user, label, value) => {
  const field = screen.getByLabelText(new RegExp(label, 'i'));
  await user.clear(field);
  await user.type(field, value);
};

export const clickButton = async (user, buttonText) => {
  const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await user.click(button);
};

export const expectFormValidation = (errorText) => {
  expect(screen.getByText(new RegExp(errorText, 'i'))).toBeInTheDocument();
};

// Component-specific test helpers
export const setupAdminTestEnv = () => ({
  mockSupabase: {
    ...mockSupabase,
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: testCampaignData, error: null }),
    })),
  },
});

export const setupWizardTestEnv = () => ({
  formData: {},
  updateFormData: vi.fn(),
  onNext: vi.fn(),
  onPrev: vi.fn(),
  campaignId: 'test-campaign-123',
});

export const setupContractTestEnv = () => ({
  mockContract: {
    contribute: vi.fn().mockResolvedValue({
      hash: '0xtest',
      wait: vi.fn().mockResolvedValue({
        blockNumber: 123,
        gasUsed: { toString: () => '21000' },
      }),
    }),
    getTotalContributions: vi.fn().mockResolvedValue('0'),
  },
});

export default {
  renderWithProviders,
  setupUser,
  mockSupabase,
  mockEthers,
  mockWeb3,
  testCampaignData,
  testDonorData,
  testCommitteeData,
  mockApiResponses,
  waitForLoadingToFinish,
  expectElementToBeInDocument,
  expectElementNotToBeInDocument,
  fillFormField,
  clickButton,
  expectFormValidation,
  setupAdminTestEnv,
  setupWizardTestEnv,
  setupContractTestEnv,
};