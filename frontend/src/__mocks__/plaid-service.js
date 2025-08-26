import { vi } from 'vitest';

export const plaidService = {
  constructor: {
    loadPlaidScript: vi.fn().mockResolvedValue(undefined)
  },
  getBankAccountInfo: vi.fn().mockResolvedValue(null),
  initializePlaidLink: vi.fn().mockResolvedValue({
    open: vi.fn()
  }),
  removeBankAccount: vi.fn().mockResolvedValue(undefined)
};

export default plaidService;