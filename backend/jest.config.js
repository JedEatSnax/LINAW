/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  silent: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
