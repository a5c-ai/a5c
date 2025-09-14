import assert from 'node:assert/strict';
import test from 'node:test';
import { enrichGithubEvent } from '../src/enrichGithubEvent.js';

// Monkey patch Octokit for tests by overriding createOctokit
function makeMockOctokit({ pr, prFiles, prCommits, compare, codeowners, branchProtection }) {
  const octo = {
    pulls: {
      async get(params) { return { data: pr }; },
      async listFiles(params) { return { data: prFiles, headers: {}, status: 200 }; },
      async listCommits(params) { return { data: prCommits, headers: {}, status: 200 }; }
    },
    paginate: async (fn, params) => {
      if (fn === octo.pulls.listFiles) return prFiles;
      if (fn === octo.pulls.listCommits) return prCommits;
      return [];
    },
    repos: {
      async getContent() {
        if (!codeowners) throw Object.assign(new Error('no file'), { status: 404 });
        return { data: { content: Buffer.from(codeowners).toString('base64') } };
      },
      async compareCommits() { return { data: compare }; },
      async getBranchProtection() { if (branchProtection) return { data: branchProtection }; throw Object.assign(new Error('forbidden'), { status: 403 }); }
    }
  };
  return octo;
}

test('PR enrichment adds pr fields and owners', async () => {
  const pr = { number: 1, state: 'open', merged: false, draft: false, base: { ref: 'main' }, head: { ref: 'feat' }, changed_files: 2, additions: 10, deletions: 2, labels: [{ name: 'documentation' }, { name: 'testing' }], requested_reviewers: [{ login: 'alice' }], requested_teams: [{ slug: 'backend' }] };
  const prFiles = [
    { filename: 'src/a.js', status: 'modified', additions: 5, deletions: 1, changes: 6 },
    { filename: 'README.md', status: 'added', additions: 5, deletions: 1, changes: 6 }
  ];
  const prCommits = [{ sha: 'abc', commit: { message: 'x' } }];
  const compare = {};
  const codeowners = "src/** @team-a\nREADME.md @docs";
  const mock = makeMockOctokit({ pr, prFiles, prCommits, compare, codeowners, branchProtection: { enabled: true } });

  const event = { repository: { full_name: 'a5c-ai/events' }, pull_request: { number: 1 } };
  const out = await enrichGithubEvent(event, { token: 't', octokit: mock, fileLimit: 50, commitLimit: 50 });
  assert.equal(out._enrichment.pr.number, 1);
  assert.equal(out._enrichment.pr.files.length, 2);
  assert.deepEqual(out._enrichment.pr.owners['src/a.js'], ['@team-a']);
  assert.deepEqual(out._enrichment.pr.owners['README.md'], ['@docs']);
  // owners_union should include both teams, sorted
  assert.deepEqual(out._enrichment.pr.owners_union, ['@docs','@team-a']);
  // labels and reviewers
  assert.deepEqual(out._enrichment.pr.labels, ['documentation','testing']);
  assert.deepEqual(out._enrichment.pr.requested_reviewers, ['alice']);
  assert.deepEqual(out._enrichment.pr.requested_teams, ['backend']);
  // has_conflicts derived from mergeable_state
  assert.equal(out._enrichment.pr.mergeable_state, 'dirty');
  assert.equal(out._enrichment.pr.has_conflicts, true);
});

test('Push enrichment adds commits and files', async () => {
  const compare = { total_commits: 1, commits: [{ sha: 'abc', commit: { message: 'm' } }], files: [{ filename: 'src/b.js', additions: 1, deletions: 0, changes: 1 }] };
  const mock = makeMockOctokit({ compare, codeowners: "src/** @team-a" });
  const event = { repository: { full_name: 'a5c-ai/events' }, before: '111', after: '222', ref: 'refs/heads/main' };
  const out = await enrichGithubEvent(event, { token: 't', octokit: mock, fileLimit: 50, commitLimit: 50 });
  assert.equal(out._enrichment.push.total_commits, 1);
  assert.equal(out._enrichment.push.files.length, 1);
  assert.deepEqual(out._enrichment.push.owners['src/b.js'], ['@team-a']);
});
