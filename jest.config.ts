import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Important: use 'node' for ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Optional: if you're using @ path aliases
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
};

export default config;
