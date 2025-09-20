import { defineConfig } from "vitest/config";
import fs from "fs";
import path from "path";

function loadCoverageThresholds() {
  try {
    const p = path.resolve(
      process.cwd(),
      "scripts",
      "coverage-thresholds.json",
    );
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, "utf8"));
      const toInt = (v: any, d: number) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : d;
      };
      return {
        lines: toInt(json.lines, 60),
        branches: toInt(json.branches, 55),
        functions: toInt(json.functions, 60),
        statements: toInt(json.statements, 60),
      } as const;
    }
  } catch {}
  // Fallback to existing defaults (non-breaking)
  return { lines: 60, branches: 55, functions: 60, statements: 60 } as const;
}

const THRESHOLDS = loadCoverageThresholds();
// Only enforce coverage thresholds inside Vitest when explicitly opted-in.
// The CI workflow performs the hard gate in a dedicated step using
// scripts/coverage-thresholds.json. This ensures artifacts and summaries
// are uploaded even when coverage is below the threshold.
const ENFORCE_IN_VITEST = process.env.VITEST_ENFORCE_COVERAGE === "true";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Retries: help detect flaky tests by auto re-running failures.
    // Use higher retries on CI if desired via env detection.
    retry: process.env.CI ? 2 : 0,
    // Emit JUnit XML for CI and dot output for console
    reporters: [
      "dot",
      ["junit", { outputFile: "junit.xml" }],
      // JSON reporter to enable post-processing of retries/slow tests in CI
      ["json", { outputFile: "vitest-results.json" }],
    ],
    coverage: {
      reporter: ["text", "lcov", "json-summary"],
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      // Exclude CLI entrypoint since e2e tests invoke compiled JS (dist/cli.js),
      // which is not instrumented against the TS source and skews coverage.
      exclude: [
        "src/cli.ts",
        // Exclude long-running CLI runner wrapper that is exercised via CLI smoke
        // tests rather than unit tests, to avoid skewing unit-test coverage.
        "src/commands/run.ts",
        // Exclude pure type definition barrels and provider types.
        "src/types.ts",
        "src/providers/types.ts",
        // emit.ts orchestrates side-effects (labels, check runs, dispatch) and
        // relies heavily on networked GitHub state. It is covered via e2e paths
        // and smoke tests, but unit coverage is intentionally excluded from the
        // global threshold to avoid skewing core library coverage.
        "src/emit.ts",
        "**/*.d.ts",
        "dist/**",
        "node_modules/**",
        "coverage/**",
      ],
      // Only enforce thresholds when explicitly required (PR hard gate is handled in the workflow)
      ...(ENFORCE_IN_VITEST
        ? {
            thresholds: {
              lines: THRESHOLDS.lines,
              branches: THRESHOLDS.branches,
              functions: THRESHOLDS.functions,
              statements: THRESHOLDS.statements,
            },
          }
        : {}),
    },
    // Include both TS and legacy JS tests (issue #251)
    include: [
      "tests/**/*.{test,spec}.{ts,js}",
      "test/**/*.{test,spec}.{ts,js}",
    ],
    exclude: ["dist/**", "node_modules/**"],
  },
});
