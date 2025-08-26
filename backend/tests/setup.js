// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.WEB3_NETWORK = 'localhost';
process.env.LOG_IN_TEST = 'false';

// Mock Winston Logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
    silent: false
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn()
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn()
  }
}));

// Mock Supabase with proper chain methods
let mockChainData = {};

const createMockChain = () => {
  const chain = {
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain), 
    update: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(() => mockChainData),
    order: jest.fn(() => chain),
    range: jest.fn(() => mockChainData),
    limit: jest.fn(() => mockChainData)
  };
  return chain;
};

const mockSupabaseClient = {
  from: jest.fn(() => createMockChain())
};

// Helper to set mock chain response
global.setMockChainResponse = (response) => {
  mockChainData = Promise.resolve(response);
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock Web3/Ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(),
    Contract: jest.fn(),
    formatEther: jest.fn((wei) => '1.0'),
    parseEther: jest.fn((eth) => '1000000000000000000'),
    formatUnits: jest.fn((value, units) => '1.0'),
    isAddress: jest.fn((address) => /^0x[a-fA-F0-9]{40}$/.test(address))
  }
}));

// Global mocks
global.mockSupabaseClient = mockSupabaseClient;

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});