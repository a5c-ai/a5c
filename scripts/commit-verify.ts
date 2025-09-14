#!/usr/bin/env -S node --loader tsx
/*
 Validates Conventional Commits for commit messages and PR titles.
 - When run with no args, reads HEAD commit message (for hooks).
 - Args:
   --file <path>   Path to commit message file (commit-msg hook)
   --message <str> Validate provided message string
   --pr-title <str> Validate provided PR title string
   --allow-merge   Allow "Merge" commits to pass
 Exits non-zero on violation; prints concise guidance.
*/
import fs from 'node:fs';

const argv = new Map<string, string | boolean>();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    const key = a.replace(/^--/, '');
    const next = process.argv[i + 1];
    if (!next || next.startsWith('--')) {
      argv.set(key, true);
    } else {
      argv.set(key, next);
      i++;
    }
  }
}

function readMessage(): string {
  if (typeof argv.get('message') === 'string') return String(argv.get('message'));
  if (typeof argv.get('pr-title') === 'string') return String(argv.get('pr-title'));
  if (typeof argv.get('file') === 'string') return fs.readFileSync(String(argv.get('file')), 'utf8');
  // Fallback: HEAD commit message
  try {
    return fs.readFileSync('.git/COMMIT_EDITMSG', 'utf8');
  } catch {
    return '';
  }
}

// Conventional Commits basic pattern (incl. scope, breaking, body ignored)
// Examples: feat: add X | fix(parser)!: drop Y | chore(release): 1.2.3
const TYPE = '(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)';
const SCOPE = '(?:\([a-z0-9_.,-]+\))?';
const BREAK = '(?:!)?';
const COLON = ':';
const SPACE = ' ';
const SUBJECT = '.+'; // at least one char
// Use regex literal for clarity and correctness
const REG = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\([a-z0-9_.,-]+\))?(?:!)?: .+$/;

let messageRaw = readMessage().split(/\r?\n/)[0]?.trim() ?? '';
// If validating a PR title, allow and strip leading non-alphanumeric (e.g., emojis)
if (argv.has('pr-title')) {
  try {
    messageRaw = messageRaw.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
  } catch {
    messageRaw = messageRaw.replace(/^[^a-z0-9]+\s*/i, '').trim();
  }
}

function allowMerge(): boolean {
  return Boolean(argv.get('allow-merge'));
}

function isMergeCommit(msg: string): boolean {
  return /^Merge( pull request)?/i.test(msg);
}

function fail(reason: string) {
  const help = [
    'Conventional Commits required: <type>(<scope>)?: <subject>',
    'Types: build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test',
    'Examples:',
    '  feat(cli): add validate command',
    '  fix(parser)!: handle null inputs',
    '  docs: update README quickstart',
  ].join('\n');
  console.error(`\n✖ Commit/Title invalid: ${reason}\n\n${help}\n`);
  process.exit(1);
}

if (!messageRaw) fail('empty message');

if (isMergeCommit(messageRaw) && allowMerge()) {
  process.exit(0);
}

if (!REG.test(messageRaw)) {
  fail(`"${messageRaw}" does not match Conventional Commits`);
}

// OK
process.exit(0);
