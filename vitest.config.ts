import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    fileParallelism: false, // Run test suites sequentially to prevent DB race conditions
    testTimeout: 20000
  }
});
