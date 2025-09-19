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
const REQUIRE_COVERAGE = process.env.REQUIRE_COVERAGE === "true";

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
        "**/*.d.ts",
        "dist/**",
        "node_modules/**",
        "coverage/**",
      ],
      // Only enforce thresholds when explicitly required (PR hard gate is handled in the workflow)
      ...(REQUIRE_COVERAGE
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
