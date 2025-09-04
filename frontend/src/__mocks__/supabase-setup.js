import { vi } from 'vitest';

export const checkSupabaseSetup = vi.fn().mockResolvedValue(true);
export const testCampaignCreation = vi.fn().mockResolvedValue({
  success: true,
  id: 'test-campaign-123',
  message: 'Campaign created successfully',
});
export const CREATE_TABLES_SQL = 'CREATE TABLE campaigns (id serial primary key);';

export default {
  checkSupabaseSetup,
  testCampaignCreation,
  CREATE_TABLES_SQL,
};
