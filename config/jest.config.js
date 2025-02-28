export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases and CSS imports
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '\\.css$': 'identity-obj-proxy',
  },
  transform: {
    // Use ts-jest for TypeScript files
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/client/src/**/*.{ts,tsx}',
    '<rootDir>/server/**/*.{ts,tsx}',
    '!<rootDir>/client/src/**/*.d.ts',
    '!<rootDir>/client/src/main.tsx',
    '!<rootDir>/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
};
