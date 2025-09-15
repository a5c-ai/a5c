import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Retries: help detect flaky tests by auto re-running failures.
    // Use higher retries on CI if desired via env detection.
    retry: process.env.CI ? 2 : 0,
    // Emit JUnit XML for CI and dot output for console
    reporters: [
      'dot',
      ['junit', { outputFile: 'junit.xml' }],
      // JSON reporter to enable post-processing of retries/slow tests in CI
      ['json', { outputFile: 'vitest-results.json' }],
    ],
    coverage: {
      reporter: ['text', 'lcov', 'json-summary'],
      provider: 'v8',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      // Exclude CLI entrypoint since e2e tests invoke compiled JS (dist/cli.js),
      // which is not instrumented against the TS source and skews coverage.
      exclude: ['src/cli.ts', '**/*.d.ts', 'dist/**', 'node_modules/**', 'coverage/**'],
      thresholds: {
        lines: 60,
        branches: 55,
        functions: 60,
        statements: 60,
      },
    },
    // Include both TS and legacy JS tests (issue #251)
    include: [
      'tests/**/*.{test,spec}.{ts,js}',
      'test/**/*.{test,spec}.{ts,js}',
    ],
    exclude: ['dist/**', 'node_modules/**']
  }
})
