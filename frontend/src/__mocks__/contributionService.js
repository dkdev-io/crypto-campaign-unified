import { vi } from 'vitest';

// Mock contribution limit check response
const mockLimitCheckResponse = {
  canContribute: true,
  currentTotal: 100,
  remainingCapacity: 3200,
  proposedAmount: 100,
  message: 'Contribution within limits',
  projection: null
};

// Mock contribution projection
const mockContributionProjection = {
  paymentCount: 12,
  totalAmount: 1200,
  willExceedLimit: false,
  autoCancelDate: null,
  finalPaymentAmount: 100
};

// Mock saved contribution response
const mockSavedContribution = {
  success: true,
  transactionCode: 'TXN-' + Date.now(),
  contributionId: 'contrib-123',
  status: 'confirmed'
};

// Mock contribution service
const contributionService = {
  // Check contribution limits
  checkContributionLimits: vi.fn(() => Promise.resolve(mockLimitCheckResponse)),
  
  // Save contribution
  saveContribution: vi.fn(() => Promise.resolve(mockSavedContribution)),
  
  // Get contribution history
  getContributionHistory: vi.fn(() => Promise.resolve({
    contributions: [],
    totalAmount: 0,
    contributionCount: 0
  })),
  
  // Calculate projection for recurring donations
  calculateRecurringProjection: vi.fn(() => Promise.resolve(mockContributionProjection)),
  
  // Validate contribution data
  validateContribution: vi.fn(() => Promise.resolve({
    isValid: true,
    errors: []
  })),
  
  // Check FEC compliance
  checkFECCompliance: vi.fn(() => Promise.resolve({
    isCompliant: true,
    warnings: [],
    errors: []
  }))
};

// Configuration helpers for tests
export const configureContributionServiceMock = {
  // Set contribution limits
  setContributionLimits: (canContribute = true, remaining = 3200, message = '') => {
    contributionService.checkContributionLimits.mockResolvedValue({
      ...mockLimitCheckResponse,
      canContribute,
      remainingCapacity: remaining,
      message: message || (canContribute ? 'Contribution within limits' : 'Exceeds contribution limits')
    });
  },

  // Set recurring projection
  setRecurringProjection: (willExceedLimit = false, paymentCount = 12) => {
    const projection = {
      ...mockContributionProjection,
      willExceedLimit,
      paymentCount,
      autoCancelDate: willExceedLimit ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
    };
    
    contributionService.calculateRecurringProjection.mockResolvedValue(projection);
    contributionService.checkContributionLimits.mockResolvedValue({
      ...mockLimitCheckResponse,
      projection
    });
  },

  // Set save result
  setSaveResult: (success = true, error = null) => {
    if (success) {
      contributionService.saveContribution.mockResolvedValue(mockSavedContribution);
    } else {
      contributionService.saveContribution.mockRejectedValue(new Error(error || 'Failed to save contribution'));
    }
  },

  // Set validation result
  setValidationResult: (isValid = true, errors = []) => {
    contributionService.validateContribution.mockResolvedValue({
      isValid,
      errors
    });
  },

  // Set FEC compliance result
  setFECComplianceResult: (isCompliant = true, warnings = [], errors = []) => {
    contributionService.checkFECCompliance.mockResolvedValue({
      isCompliant,
      warnings,
      errors
    });
  },

  // Reset all mocks
  reset: () => {
    vi.clearAllMocks();
    contributionService.checkContributionLimits.mockResolvedValue(mockLimitCheckResponse);
    contributionService.saveContribution.mockResolvedValue(mockSavedContribution);
  }
};

export default contributionService;
export {
  mockLimitCheckResponse,
  mockContributionProjection,
  mockSavedContribution
};