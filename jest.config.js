module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testRegex: 'src/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  rootDir: '.',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/vendor/**',
    '!src/__test-utils__/**',
    '!src/__e2e__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 65,
      lines: 70,
    },
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'jest-junit.xml',
      },
    ],
  ],
};
