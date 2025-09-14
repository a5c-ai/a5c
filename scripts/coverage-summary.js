#!/usr/bin/env node
/**
 * Summarize coverage from coverage/coverage-summary.json and enforce Vitest thresholds.
 * - Prints a markdown table to stdout
 * - Appends to GITHUB_STEP_SUMMARY if set
 * - Exits non-zero if any threshold is not met
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseThresholdsFromVitestConfig() {
  const tsPath = path.join(ROOT, 'vitest.config.ts');
  const jsPath = path.join(ROOT, 'vitest.config.js');
  let src = '';
  if (fs.existsSync(tsPath)) src = fs.readFileSync(tsPath, 'utf8');
  else if (fs.existsSync(jsPath)) src = fs.readFileSync(jsPath, 'utf8');
  else return {};

  // crude parse of thresholds block
  const m = src.match(/thresholds\s*:\s*\{([\s\S]*?)\}/m);
  if (!m) return {};
  const body = m[1];
  const out = {};
  for (const key of ['lines','branches','functions','statements']) {
    const km = body.match(new RegExp(key + "\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)"));
    if (km) out[key] = Number(km[1]);
  }
  return out;
}

function buildTable(total) {
  const row = (k) => `| ${k} | ${Number(total?.[k]?.pct ?? 0).toFixed(2)}% | ${total?.[k]?.covered ?? 0}/${total?.[k]?.total ?? 0} |`;
  return [
    '## Coverage Summary',
    '',
    '| Metric | Percent | Covered/Total |',
    '|---|---:|---:|',
    row('lines'),
    row('statements'),
    row('functions'),
    row('branches'),
    '',
  ];
}

async function main() {
  const summaryPath = path.join(ROOT, 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error('coverage-summary.json not found at', summaryPath);
    process.exitCode = 2;
    return;
  }
  const sum = readJson(summaryPath);
  const t = sum.total || {};
  const lines = buildTable(t);

  const thresholds = parseThresholdsFromVitestConfig();
  const checks = [];
  for (const metric of ['lines','branches','functions','statements']) {
    const actual = Number(t?.[metric]?.pct ?? 0);
    const expected = Number(thresholds?.[metric]);
    if (!Number.isFinite(expected)) continue;
    const ok = actual >= expected;
    checks.push({ metric, actual, expected, ok });
  }
  const anyFail = checks.some(c => !c.ok);
  if (checks.length) {
    lines.push('### Thresholds', '');
    lines.push('| Metric | Actual | Expected | Status |');
    lines.push('|---|---:|---:|:--:|');
    for (const c of checks) {
      const status = c.ok ? '✅' : '❌';
      lines.push(`| ${c.metric} | ${c.actual.toFixed(2)}% | ${c.expected.toFixed(2)}% | ${status} |`);
    }
    lines.push('');
  }

  const out = lines.join('\n');
  console.log(out);
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + '\n'); } catch {}
  }
  if (anyFail) {
    console.error('Coverage thresholds not met. Failing.');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('coverage-summary failed:', e?.stack || e?.message || String(e));
  process.exit(1);
});
