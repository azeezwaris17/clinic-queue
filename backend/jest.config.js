// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/tests/**/*'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Enhanced reporting
  verbose: true,
  colors: true,
  testTimeout: 30000,
  
  // Coverage configuration
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov',
    'json'
  ],
  
  // Better test output
  displayName: {
    name: 'CLINIC-QUEUE',
    color: 'blue'
  }
};