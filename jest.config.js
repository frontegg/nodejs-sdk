module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testRegex: 'src/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  rootDir: '.',
  collectCoverageFrom: ['src/**/*.{js,ts}', '!**/node_modules/**', '!**/dist/**', '!**/vendor/**'],
  coverageThreshold: {
    global: {
      statements: 17,
      branches: 24,
      functions: 20,
      lines: 18,
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
