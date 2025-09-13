import { describe, it, expect } from 'vitest';
import { handleEnrich } from '../src/enrich.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Build a minimal PR synchronize event that will trigger PR enrichment paths
function makePullRequestEvent() {
  return {
    repository: { full_name: 'a5c-ai/events' },
    pull_request: { number: 1, base: { ref: 'main' }, head: { ref: 'feat' } },
  } as any;
}

// Build a minimal push event with before/after to trigger compare
function makePushEvent() {
  return {
    repository: { full_name: 'a5c-ai/events' },
    before: '111',
    after: '222',
    ref: 'refs/heads/main',
  } as any;
}

// Mock Octokit-like object to control files and patches
function makeMockOctokit({ prFiles, compareFiles }: { prFiles?: any[]; compareFiles?: any[] }) {
  const pr = { number: 1, state: 'open', merged: false, draft: false, base: { ref: 'main' }, head: { ref: 'feat' }, changed_files: prFiles?.length || 0, additions: 0, deletions: 0 };
  const prCommits = [{ sha: 'abc', commit: { message: 'm' } }];
  const compare = { total_commits: 1, commits: prCommits, files: compareFiles || [] };
  const codeowners = '';
  const octo = {
    pulls: {
      async get() { return { data: pr }; },
      async listFiles() { return { data: prFiles || [], headers: {}, status: 200 }; },
      async listCommits() { return { data: prCommits, headers: {}, status: 200 }; },
    },
    paginate: async (fn: any) => {
      if (fn === octo.pulls.listFiles) return prFiles || [];
      if (fn === octo.pulls.listCommits) return prCommits;
      return [];
    },
    repos: {
      async getContent() { return { data: { content: Buffer.from(codeowners).toString('base64') } }; },
      async compareCommits() { return { data: compare }; },
      async getBranchProtection() { throw Object.assign(new Error('forbidden'), { status: 403 }); },
    },
  };
  return octo;
}

describe('enrich include_patch flag behavior', () => {
  it('keeps patch when include_patch=true for PR files', async () => {
    const prFiles = [
      { filename: 'src/a.ts', additions: 1, deletions: 0, changes: 1, patch: '@@ -1 +1 @@\n+1' },
    ];
    const octokit = makeMockOctokit({ prFiles });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evt-'));
    const file = path.join(tmp, 'pr.json');
    fs.writeFileSync(file, JSON.stringify(makePullRequestEvent()));
    const { output } = await handleEnrich({ in: file, labels: [], rules: undefined, flags: { include_patch: 'true' }, octokit, });
    const files = (output.enriched as any)?.github?.pr?.files || [];
    expect(files.length).toBe(1);
    expect(files[0].patch).toBeTypeOf('string');
  });

  it('removes patch when include_patch=false for PR files', async () => {
    const prFiles = [
      { filename: 'src/a.ts', additions: 1, deletions: 0, changes: 1, patch: '@@ -1 +1 @@\n+1' },
    ];
    const octokit = makeMockOctokit({ prFiles });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evt-'));
    const file = path.join(tmp, 'pr.json');
    fs.writeFileSync(file, JSON.stringify(makePullRequestEvent()));
    const { output } = await handleEnrich({ in: file, labels: [], rules: undefined, flags: { include_patch: 'false' }, octokit, });
    const files = (output.enriched as any)?.github?.pr?.files || [];
    expect(files.length).toBe(1);
    expect(files[0].patch).toBeUndefined();
  });

  it('applies include_patch flag for push files (compare API)', async () => {
    const compareFiles = [
      { filename: 'src/b.ts', additions: 1, deletions: 0, changes: 1, patch: '@@ -1 +1 @@\n+1' },
    ];
    const octokit = makeMockOctokit({ compareFiles });

    // true → patches present
    let tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evt-'));
    let file = path.join(tmp, 'push.json');
    fs.writeFileSync(file, JSON.stringify(makePushEvent()));
    let { output } = await handleEnrich({ in: file, labels: [], rules: undefined, flags: { include_patch: 'true' }, octokit, });
    let files = (output.enriched as any)?.github?.push?.files || [];
    expect(files[0].patch).toBeTypeOf('string');

    // false → patches removed
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'evt-'));
    file = path.join(tmp, 'push.json');
    fs.writeFileSync(file, JSON.stringify(makePushEvent()));
    ;({ output } = await handleEnrich({ in: file, labels: [], rules: undefined, flags: { include_patch: 'false' }, octokit, }));
    files = (output.enriched as any)?.github?.push?.files || [];
    expect(files[0].patch).toBeUndefined();
  });
});
