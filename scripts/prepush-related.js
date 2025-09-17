#!/usr/bin/env node
/*
  Runs related tests for changed files since upstream default.
  Falls back to full test run on errors or no related files.
  Skips in CI when A5C_SKIP_PREPUSH or SKIP_PREPUSH set.
*/
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

function vitestCmd() {
  // Prefer local vitest from node_modules/.bin for reliability
  const isWin = process.platform === "win32";
  const bin = isWin ? "vitest.cmd" : "vitest";
  const local = path.join(process.cwd(), "node_modules", ".bin", bin);
  if (fs.existsSync(local)) return `"${local}"`;
  // Fallback to npx which will resolve vitest from devDependencies
  return "npx --yes vitest";
}

try {
  let base = process.env.A5C_BASE_REF || "origin/a5c/main";
  try {
    require("node:child_process").execSync(`git ls-remote --exit-code --heads origin a5c/main`, {stdio: "ignore"});
  } catch {
    base = process.env.A5C_BASE_REF || "origin/main";
  }
  // List changed source files
  // Use Git pathspec globs; avoid shell brace expansion which Git doesn't support.
  // Keep patterns quoted so the shell doesn't expand them before Git receives them.
  const diffCmd = `git diff --name-only ${base}...HEAD -- \
    'src/**/*.ts' 'src/**/*.tsx' \
    'tests/**/*.ts' 'tests/**/*.tsx' 'tests/**/*.js' \
    'test/**/*.ts' 'test/**/*.tsx' 'test/**/*.js'`;
  const out = sh(diffCmd);
  const files = out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (files.length === 0) {
    console.log("No relevant changed files; running full test suite.");
    run(`${vitestCmd()} run`);
    process.exit(0);
  }
  const list = files.map((f) => `'${f}'`).join(" ");
  console.log("Running related tests for changed files:", files);
  run(`${vitestCmd()} related ${list}`);
} catch (err) {
  console.warn(
    "Related tests failed or unavailable, falling back to full run. Error:",
    err?.message,
  );
  run(`${vitestCmd()} run`);
}
