import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  maxWorkers: 1,
  preset: 'ts-jest/presets/default-esm',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          module: 'ESNext',
          moduleResolution: 'bundler',
          types: ['jest', 'node'],
          verbatimModuleSyntax: false,
        },
        useESM: true,
      },
    ],
  },
};

export default config;
