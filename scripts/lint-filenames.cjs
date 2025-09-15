#!/usr/bin/env node
/*
  Fast filename linter to prevent Windows-invalid filenames in the repo.
  - Flags characters: < > : " / \ | ? *
  - Flags trailing spaces or periods
  - Flags reserved device names (CON, PRN, AUX, NUL, COM1..COM9, LPT1..LPT9)
  - Ignores .git directory and node_modules, dist, coverage by default
  Exit code 1 on violations with a concise report.
*/

const { execSync } = require('node:child_process');

// Directories to ignore
const IGNORED_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'coverage', '.husky', '.a5c'
]);

// Reserved device names on Windows (case-insensitive), may have extension
const RESERVED = new Set([
  'CON','PRN','AUX','NUL',
  'COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9',
  'LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9'
]);

// Invalid characters in Windows filenames
const INVALID_CHARS = /[<>:"/\\|?*]/;

// Trailing space or period (.) is invalid on Windows
const TRAILING_SPACE_OR_DOT = /[ \.]$/;

function isIgnored(path) {
  // Ignore any path segment in IGNORED_DIRS
  return path.split('/').some(seg => IGNORED_DIRS.has(seg));
}

function hasInvalidSegment(path) {
  const segments = path.split('/');
  for (const seg of segments) {
    if (!seg) continue; // skip empty (leading ./)
    // Check reserved device names (segment before extension)
    const base = seg.split('.')[0].toUpperCase();
    if (RESERVED.has(base)) return { seg, reason: `reserved name: ${base}` };
    if (INVALID_CHARS.test(seg)) return { seg, reason: 'invalid character' };
    if (TRAILING_SPACE_OR_DOT.test(seg)) return { seg, reason: 'trailing space or dot' };
  }
  return null;
}

function listFiles() {
  try {
    const out = execSync('git ls-files', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    // Fallback to ripgrep if repo-less run
    try {
      const out = execSync("rg --files", { encoding: 'utf8' });
      return out.split('\n').filter(Boolean);
    } catch {
      console.error('Failed to list files');
      process.exit(2);
    }
  }
}

const files = listFiles();
const violations = [];
for (const f of files) {
  if (isIgnored(f)) continue;
  const v = hasInvalidSegment(f);
  if (v) violations.push({ file: f, ...v });
}

if (violations.length) {
  console.error('Windows-invalid filenames detected:\n');
  for (const v of violations) {
    console.error(` - ${v.file}  ← ${v.reason}`);
  }
  console.error(`\nTotal: ${violations.length} file(s).`);
  process.exit(1);
}

console.log('Filename lint passed: no Windows-invalid filenames found.');
