#!/usr/bin/env node
/*
Detect flaky tests from Vitest JUnit output.

Signals flakiness when:
- testcase has a failure but suite overall passed (retries succeeded), or
- multiple <testcase> entries for same name/classname with mixed outcomes, or
- explicit retries detected via repeated entries.

Outputs JSON summary to stdout and (optional) writes a PR comment file.
*/
const fs = require('fs');
const path = require('path');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function parseXmlLite(xml) {
  // Very simple JUnit parser tailored for vitest junit reporter.
  // Not a full XML parser to avoid dependencies in CI step.
  // Assumes structure: <testsuites> or single <testsuite> with <testcase> children.
  const suites = [];
  const suiteRe = /<testsuite\b([\s\S]*?)>([\s\S]*?)<\/testsuite>/g;
  let m;
  const rootHasSuites = /<testsuite\b/.test(xml);
  if (!rootHasSuites) return { suites: [], cases: [] };
  while ((m = suiteRe.exec(xml)) !== null) {
    const attrs = attrMap(m[1]);
    const body = m[2];
    const cases = [];
    const caseRe = /<testcase\b([\s\S]*?)>([\s\S]*?)<\/testcase>|<testcase\b([\s\S]*?)\/>/g;
    let c;
    while ((c = caseRe.exec(body)) !== null) {
      const attrStr = c[1] || c[3] || '';
      const inner = c[2] || '';
      const a = attrMap(attrStr);
      const failed = /<failure\b[\s\S]*?<\/failure>/.test(inner) || /<failure\b[^>]*\/>/.test(inner) || /<error\b[\s\S]*?<\/error>/.test(inner) || /<error\b[^>]*\/>/.test(inner);
      const skipped = /<skipped\b[\s\S]*?<\/skipped>/.test(inner) || /<skipped\b[^>]*\/>/.test(inner);
      cases.push({
        name: a.name || '',
        classname: a.classname || a.class || '',
        file: a.file || '',
        time: a.time ? Number(a.time) : null,
        failed,
        skipped,
        raw: inner,
      });
    }
    suites.push({ name: attrs.name || '', cases });
  }
  const allCases = suites.flatMap(s => s.cases);
  return { suites, cases: allCases };
}

function attrMap(s) {
  const map = {};
  const re = /(\w+)=\"([^\"]*)\"/g;
  let m;
  while ((m = re.exec(s)) !== null) { map[m[1]] = m[2]; }
  return map;
}

function detectFlaky(parsed) {
  // Group by key: classname|name or file|name
  const groups = new Map();
  for (const tc of parsed.cases) {
    const key = [tc.classname || tc.file || 'unknown', tc.name || ''].join('|');
    const g = groups.get(key) || { key, runs: [] };
    g.runs.push(tc);
    groups.set(key, g);
  }
  const flakies = [];
  for (const g of groups.values()) {
    if (g.runs.length <= 1) continue; // single appearance unlikely to indicate retries
    const anyFail = g.runs.some(r => r.failed);
    const anyPass = g.runs.some(r => !r.failed && !r.skipped);
    if (anyFail && anyPass) {
      const sample = g.runs[g.runs.length - 1];
      flakies.push({
        name: sample.name,
        classname: sample.classname,
        file: sample.file,
        attempts: g.runs.length,
        failed_runs: g.runs.filter(r => r.failed).length,
        passed_runs: g.runs.filter(r => !r.failed && !r.skipped).length,
      });
    }
  }
  return flakies;
}

function main() {
  const junitPath = process.env.JUNIT_XML || path.resolve(process.cwd(), 'junit.xml');
  const outPath = process.env.OUT_JSON || '';
  const prMarkdown = process.env.PR_MD || '';
  const minAttempts = Number(process.env.MIN_ATTEMPTS || '2');
  const xml = readFileSafe(junitPath);
  if (!xml) {
    console.error(`JUnit file not found: ${junitPath}`);
    process.stdout.write(JSON.stringify({ flakies: [], found: false }));
    process.exit(0);
  }
  const parsed = parseXmlLite(xml);
  const flakies = detectFlaky(parsed).filter(f => f.attempts >= minAttempts);
  const result = { flakies, found: flakies.length > 0, count: flakies.length };
  const json = JSON.stringify(result, null, 2);
  if (outPath) { try { fs.writeFileSync(outPath, json); } catch {} }
  if (prMarkdown) {
    const lines = [];
    lines.push('<!-- a5c:flaky-detector -->');
    lines.push('## 🧪 Flaky Tests Summary');
    if (!result.found) {
      lines.push('No flaky tests detected (no mixed pass/fail across retries).');
    } else {
      lines.push('The following tests appear flaky (failures followed by passes within the run):');
      lines.push('');
      lines.push('| Test | File/Class | Attempts | Failed | Passed |');
      lines.push('|---|---|---:|---:|---:|');
      for (const f of flakies) {
        const loc = f.file || f.classname || '';
        lines.push(`| ${escapePipes(f.name)} | ${escapePipes(loc)} | ${f.attempts} | ${f.failed_runs} | ${f.passed_runs} |`);
      }
    }
    try { fs.writeFileSync(prMarkdown, lines.join('\n')); } catch {}
  }
  process.stdout.write(json);
}

function escapePipes(s) {
  return String(s ?? '').replace(/\|/g, '\\|');
}

if (require.main === module) {
  main();
}
