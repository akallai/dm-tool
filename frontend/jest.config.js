const { createCjsPreset } = require('jest-preset-angular/presets');

const presetConfig = createCjsPreset({
  tsconfig: '<rootDir>/tsconfig.spec.json',
  stringifyContentPathRegex: '\\.(html|svg)$',
});

/** @type {import('jest').Config} */
module.exports = {
  ...presetConfig,
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|lodash-es|@xaroth8088/random-names)',
  ],
};
