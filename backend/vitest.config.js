const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.js'],
    exclude: ['**/node_modules/**', '**/*.int.test.js'],
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true
  }
});