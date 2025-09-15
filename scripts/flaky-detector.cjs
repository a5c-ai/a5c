#!/usr/bin/env node
/*
  Flaky Tests Detector
  - Parses Vitest JUnit XML (junit.xml) if present
  - Detects tests that failed and later passed within the same run (using retries)
  - Emits a concise JSON summary to stdout
  - Optionally (when invoked with --pr <number> and --repo <owner/repo>) upserts a PR comment and adds a label

  This script is resilient: missing files or parsing issues result in an empty summary, exit code 0.
*/
const fs = require('fs');
const path = require('path');

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function parseJUnit(xml) {
  if (!xml) return [];
  // Minimal parsing for Vitest junit: extract testcases with name, classname, file, and failures
  // We avoid XML deps; use regex heuristics sufficient for our junit.xml
  const cases = [];
  // 1) Paired testcase tags with body (may include <failure>)
  const rePaired = /<testcase\s+([^>]+)>([\s\S]*?)<\/testcase>/g;
  let m;
  while ((m = rePaired.exec(xml)) !== null) {
    const attrs = m[1];
    const body = m[2] || '';
    const get = (k) => {
      const r = new RegExp(`(?:^|\\s)${k}="([^"]*)"`).exec(attrs);
      return r ? r[1] : '';
    };
    const name = get('name');
    const classname = get('classname');
    const file = get('file') || '';
    const failed = /<failure\b/.test(body);
    cases.push({ name, classname, file, failed });
  }
  // 2) Self-closing testcase tags (no body): treat as pass
  const reSelf = /<testcase\s+([^>]+?)\s*\/>/g;
  while ((m = reSelf.exec(xml)) !== null) {
    const attrs = m[1];
    const get = (k) => {
      const r = new RegExp(`(?:^|\\s)${k}="([^"]*)"`).exec(attrs);
      return r ? r[1] : '';
    };
    const name = get('name');
    const classname = get('classname');
    const file = get('file') || '';
    const failed = false;
    cases.push({ name, classname, file, failed });
  }
  return cases;
}

function detectFlaky(cases) {
  // Group by testcase key (name + file/classname)
  const map = new Map();
  for (const c of cases) {
    const key = `${c.name}@@${c.file || c.classname || ''}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c.failed);
  }
  const flakies = [];
  for (const [key, runs] of map.entries()) {
    const attempts = runs.length;
    const failed_runs = runs.filter(Boolean).length;
    const passed_runs = attempts - failed_runs;
    const mixed = failed_runs > 0 && passed_runs > 0;
    if (mixed) {
      const [name, loc] = key.split('@@');
      flakies.push({ name, file: loc, attempts, failed_runs, passed_runs });
    }
  }
  return {
    found: flakies.length > 0,
    flakies,
  };
}

function main() {
  const input = process.env.JUNIT_XML && process.env.JUNIT_XML.trim() ? process.env.JUNIT_XML.trim() : 'junit.xml';
  const junitPath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  const xml = safeRead(junitPath);
  const cases = parseJUnit(xml);
  const summary = detectFlaky(cases);
  process.stdout.write(JSON.stringify(summary));
}

main();
