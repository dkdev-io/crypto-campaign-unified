import { vi } from 'vitest';

export const processContribution = vi.fn().mockResolvedValue({
  success: true,
  transactionHash: '0xabc123...',
  blockNumber: 18500000,
  gasUsed: '21000',
});

export default {
  processContribution,
};
