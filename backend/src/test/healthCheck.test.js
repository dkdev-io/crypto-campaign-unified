import { DatabaseHealthCheck } from '../health/databaseHealthCheck.js';
import { jest } from '@jest/globals';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
};

const mockSupabaseSelect = {
  select: jest.fn().mockReturnThis(),
};

const mockSupabaseResponse = {
  data: null,
  error: null,
};

// Mock createClient
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('DatabaseHealthCheck', () => {
  let healthCheck;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';

    healthCheck = new DatabaseHealthCheck();

    // Default mock setup
    mockSupabaseClient.from.mockReturnValue(mockSupabaseSelect);
    mockSupabaseSelect.select.mockResolvedValue(mockSupabaseResponse);
    mockSupabaseClient.rpc.mockResolvedValue({ data: 'TXN-12345678-ABCD', error: null });
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  describe('initializeClient', () => {
    it('should initialize client with valid credentials', () => {
      const client = healthCheck.initializeClient();
      expect(client).toBeDefined();
    });

    it('should throw error without SUPABASE_URL', () => {
      delete process.env.SUPABASE_URL;

      expect(() => {
        healthCheck.initializeClient();
      }).toThrow('Missing Supabase configuration');
    });

    it('should throw error without SUPABASE_ANON_KEY', () => {
      delete process.env.SUPABASE_ANON_KEY;

      expect(() => {
        healthCheck.initializeClient();
      }).toThrow('Missing Supabase configuration');
    });
  });

  describe('checkConnectivity', () => {
    it('should return connected status on successful connection', async () => {
      const result = await healthCheck.checkConnectivity();

      expect(result.status).toBe('connected');
      expect(result.timestamp).toBeDefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('campaigns');
    });

    it('should return failed status on connection error', async () => {
      mockSupabaseSelect.select.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await healthCheck.checkConnectivity();

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Connection failed');
    });

    it('should handle client initialization errors', async () => {
      delete process.env.SUPABASE_URL;

      const result = await healthCheck.checkConnectivity();

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Missing Supabase configuration');
    });
  });

  describe('validateTables', () => {
    it('should validate all required tables successfully', async () => {
      const result = await healthCheck.validateTables();

      expect(result.status).toBe('success');
      expect(result.missingTables).toHaveLength(0);
      expect(Object.keys(result.tables)).toHaveLength(4);

      // Check that all required tables are validated
      expect(result.tables['campaigns']).toEqual({
        exists: true,
        accessible: true,
      });
    });

    it('should detect missing tables', async () => {
      // Mock error for contributions table
      mockSupabaseClient.from.mockImplementation((tableName) => {
        if (tableName === 'contributions') {
          return {
            select: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'relation "contributions" does not exist' },
            }),
          };
        }
        return mockSupabaseSelect;
      });

      const result = await healthCheck.validateTables();

      expect(result.status).toBe('failed');
      expect(result.missingTables).toContain('contributions');
      expect(result.tables['contributions'].exists).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      const result = await healthCheck.validateTables();

      expect(result.status).toBe('failed');
      expect(result.missingTables).toHaveLength(4); // All tables should be marked as missing
    });
  });

  describe('validateFunctions', () => {
    it('should validate all required functions successfully', async () => {
      const result = await healthCheck.validateFunctions();

      expect(result.status).toBe('success');
      expect(result.missingFunctions).toHaveLength(0);
      expect(Object.keys(result.functions)).toHaveLength(3);
    });

    it('should detect missing functions', async () => {
      mockSupabaseClient.rpc.mockImplementation((functionName) => {
        if (functionName === 'generate_transaction_code') {
          return Promise.resolve({
            data: null,
            error: { message: 'function "generate_transaction_code" does not exist' },
          });
        }
        return Promise.resolve({ data: true, error: null });
      });

      const result = await healthCheck.validateFunctions();

      expect(result.status).toBe('failed');
      expect(result.missingFunctions).toContain('generate_transaction_code');
    });

    it('should test function with correct parameters', async () => {
      await healthCheck.validateFunctions();

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('generate_transaction_code');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('calculate_recurring_projection', {
        p_amount: 100,
        p_frequency: 'monthly',
        p_start_date: '2024-01-01',
      });
    });
  });

  describe('generateRecoverySuggestions', () => {
    it('should suggest schema application for missing tables', () => {
      const healthResults = {
        tables: {
          missingTables: ['contributions', 'recurring_payments'],
        },
      };

      const suggestions = healthCheck.generateRecoverySuggestions(healthResults);

      const tableSuggestion = suggestions.find((s) => s.issue === 'Missing Database Tables');
      expect(tableSuggestion).toBeDefined();
      expect(tableSuggestion.severity).toBe('critical');
      expect(tableSuggestion.command).toContain('supabase-contributions-schema.sql');
    });

    it('should suggest connectivity fix for connection issues', () => {
      const healthResults = {
        connectivity: { status: 'failed' },
      };

      const suggestions = healthCheck.generateRecoverySuggestions(healthResults);

      const connectivitySuggestion = suggestions.find(
        (s) => s.issue === 'Database Connectivity Failed'
      );
      expect(connectivitySuggestion).toBeDefined();
      expect(connectivitySuggestion.severity).toBe('critical');
    });

    it('should return healthy status when no issues', () => {
      const healthResults = {
        connectivity: { status: 'connected' },
        tables: { missingTables: [] },
        functions: { missingFunctions: [] },
      };

      const suggestions = healthCheck.generateRecoverySuggestions(healthResults);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].issue).toBe('None');
      expect(suggestions[0].action).toBe('Database is healthy');
    });
  });

  describe('runHealthCheck', () => {
    it('should perform complete health check successfully', async () => {
      const result = await healthCheck.runHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.connectivity).toBeDefined();
      expect(result.tables).toBeDefined();
      expect(result.functions).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should fail gracefully on connectivity issues', async () => {
      mockSupabaseSelect.select.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await healthCheck.runHealthCheck();

      expect(result.status).toBe('failed');
      expect(result.connectivity.status).toBe('failed');
    });

    it('should complete check even with table validation failures', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Table access failed');
      });

      const result = await healthCheck.runHealthCheck();

      expect(result.status).toBe('failed');
      expect(result.tables.status).toBe('failed');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });
});
