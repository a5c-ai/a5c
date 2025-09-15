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
      // Count coverage across the whole source tree but exclude entrypoints
      // and infrastructural/types-only modules that aren't expected to be
      // exercised by unit tests. This keeps thresholds meaningful for
      // runtime logic, and prevents intermittent breaks when adding
      // new CLI flags or provider shims without tests.
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        'dist/**',
        'node_modules/**',
        'coverage/**',
        // CI stability: exclude CLI entry binary and type-only modules
        'src/cli.ts',
        'src/types.ts',
        'src/validate.ts',
        'src/utils/stable.ts',
        // Provider adapters typically require integration/e2e; exclude here
        'src/providers/**',
      ],
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
