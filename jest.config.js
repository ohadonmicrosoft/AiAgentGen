export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  transform: {
    // Use ts-jest for TypeScript files
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/client/src/**/*.{ts,tsx}',
    '!<rootDir>/client/src/**/*.d.ts',
    '!<rootDir>/client/src/main.tsx',
    '!<rootDir>/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  // Handle CSS imports (with CSS modules)
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '@/(.*)': '<rootDir>/client/src/$1',
    '@shared/(.*)': '<rootDir>/shared/$1',
  },
}; 