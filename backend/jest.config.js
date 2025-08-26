export default {
  testEnvironment: 'node',
  preset: undefined,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  maxConcurrency: 5,
  verbose: true,
  moduleFileExtensions: ['js', 'json'],
  testEnvironmentOptions: {},
  forceExit: true,
  clearMocks: true
};