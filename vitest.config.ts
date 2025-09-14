import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov', 'json-summary'],
      provider: 'v8',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', 'dist/**', 'node_modules/**', 'coverage/**'],
      thresholds: {
        lines: 60,
        branches: 55,
        functions: 60,
        statements: 60,
      },
    },
    // TS-first tests; legacy JS stubs are intentionally not included
    include: [
      'tests/**/*.{test,spec}.ts',
      'test/**/*.{test,spec}.ts',
    ],
    exclude: ['dist/**', 'node_modules/**']
  }
})
