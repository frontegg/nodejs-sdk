/* eslint-env node */
module.exports = {
  transform: { '^.+\\.ts?$': 'ts-jest' },
  testEnvironment: 'node',
  testRegex: 'src/__e2e__/.*\\.e2e\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  rootDir: '.',
  testTimeout: 60000,
  forceExit: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'jest-e2e-junit.xml',
      },
    ],
  ],
};
