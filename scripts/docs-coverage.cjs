#!/usr/bin/env node
// Minimal docs coverage scan: counts Markdown files under docs/ and flags empties
const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

function nonEmpty(file) {
  try {
    const s = fs.statSync(file);
    if (s.size === 0) return false;
    const txt = fs.readFileSync(file, 'utf8').trim();
    return txt.length > 0;
  } catch { return false; }
}

(function main() {
  const root = path.resolve('docs');
  if (!fs.existsSync(root)) {
    console.log(JSON.stringify({ total: 0, nonEmpty: 0, empty: 0, files: [] }, null, 2));
    process.exit(0);
  }
  const files = walk(root).sort();
  const stats = files.map(f => ({ file: f, nonEmpty: nonEmpty(f) }));
  const nonEmptyCount = stats.filter(s => s.nonEmpty).length;
  const emptyCount = stats.length - nonEmptyCount;
  const report = { total: stats.length, nonEmpty: nonEmptyCount, empty: emptyCount, files: stats };
  console.log(JSON.stringify(report, null, 2));
})();
