/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/client/src/__tests__/integration/**/*.test.{ts,tsx}',
    '<rootDir>/server/__tests__/integration/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage-integration',
  testTimeout: 30000, // Longer timeout for integration tests
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  // Use a different test database for integration tests
  testEnvironmentOptions: {
    url: 'http://localhost',
    testURL: 'http://localhost',
  },
};

module.exports = config;
