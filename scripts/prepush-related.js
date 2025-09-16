#!/usr/bin/env node
/*
  Runs related tests for changed files since upstream default.
  Falls back to full test run on errors or no related files.
  Skips in CI when A5C_SKIP_PREPUSH or SKIP_PREPUSH set.
*/
import { execSync } from "node:child_process";

const SKIP = process.env.A5C_SKIP_PREPUSH || process.env.SKIP_PREPUSH;
if (SKIP) {
  console.log("Skipping pre-push checks due to env flag.");
  process.exit(0);
}

function sh(cmd) {
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

try {
  const base = process.env.A5C_BASE_REF || "origin/a5c/main";
  // List changed source files
  const diffCmd = `git diff --name-only ${base}...HEAD -- 'src/**/*.{ts,tsx}' 'tests/**/*.{ts,tsx,js}' 'test/**/*.{ts,tsx,js}'`;
  const out = sh(diffCmd);
  const files = out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (files.length === 0) {
    console.log("No relevant changed files; running full test suite.");
    run("vitest run");
    process.exit(0);
  }
  const list = files.map((f) => `'${f}'`).join(" ");
  console.log("Running related tests for changed files:", files);
  run(`vitest related ${list}`);
} catch (err) {
  console.warn(
    "Related tests failed or unavailable, falling back to full run. Error:",
    err?.message,
  );
  run("vitest run");
}
