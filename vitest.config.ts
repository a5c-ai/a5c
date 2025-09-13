import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
    },
    // TS-first tests; legacy JS stubs are intentionally not included
    include: [
      'tests/**/*.{test,spec}.ts',
      'test/**/*.{test,spec}.ts',
    ],
    exclude: ['dist/**', 'node_modules/**']
  }
})

