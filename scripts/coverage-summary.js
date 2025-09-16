#!/usr/bin/env node
// ESM script (package type: module)
import fs from "node:fs";
import path from "node:path";

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function findRepoRoot(start = process.cwd()) {
  let dir = start;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  return start;
}

function parseVitestThresholds(vitestConfigPath) {
  const defaults = { lines: 60, statements: 60, functions: 60, branches: 55 };
  try {
    const src = fs.readFileSync(vitestConfigPath, "utf8");
    // naive extraction for numeric thresholds inside `thresholds: { ... }`
    const sectionMatch = src.match(/thresholds\s*:\s*\{([\s\S]*?)\}/);
    if (!sectionMatch) return defaults;
    const body = sectionMatch[1];
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const m = body.match(new RegExp(key + "\s*:\s*(\n|\r|\s)*(\d+)", "m"));
      if (m) out[key] = Number(m[2]);
    }
    return out;
  } catch {
    return defaults;
  }
}

function makeTable(total) {
  const row = (k) =>
    `| ${k} | ${Number(total[k]?.pct ?? 0).toFixed(2)}% | ${total[k]?.covered ?? 0}/${total[k]?.total ?? 0} |`;
  return [
    "| Metric | Percent | Covered/Total |",
    "|---|---:|---:|",
    row("lines"),
    row("statements"),
    row("functions"),
    row("branches"),
    "",
  ].join("\n");
}

const repo = findRepoRoot();
const covSummaryPath = path.join(repo, "coverage", "coverage-summary.json");
const summary = readJSON(covSummaryPath);

if (!summary || !summary.total) {
  console.log("## Coverage Summary");
  console.log();
  console.log(
    "_coverage/coverage-summary.json not found; ensure vitest json-summary reporter is enabled_",
  );
  process.exit(2);
}

const vitestCfgPath = path.join(repo, "vitest.config.ts");
const thresholds = parseVitestThresholds(vitestCfgPath);
const total = summary.total;

const meets = {
  lines: (total.lines?.pct ?? 0) >= thresholds.lines,
  statements: (total.statements?.pct ?? 0) >= thresholds.statements,
  functions: (total.functions?.pct ?? 0) >= thresholds.functions,
  branches: (total.branches?.pct ?? 0) >= thresholds.branches,
};
const allPass = Object.values(meets).every(Boolean);

const table = makeTable(total);

const title = allPass ? "## Coverage Summary ✅" : "## Coverage Summary ❌";
console.log(title);
console.log();
console.log(table);
console.log(
  `Thresholds: L${thresholds.lines}/S${thresholds.statements}/F${thresholds.functions}/B${thresholds.branches}`,
);

// Append to job summary if available
if (
  process.env.GITHUB_STEP_SUMMARY &&
  fs.existsSync(path.dirname(process.env.GITHUB_STEP_SUMMARY))
) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `${title}\n\n${table}\n\n`,
  );
}

process.exit(allPass ? 0 : 1);
