import { describe, it, expect } from 'vitest'
import { enrichGithubEvent } from '../src/enrichGithubEvent.js'

function makeMockOctokit({ pr, prFiles, prCommits, compare, codeowners, branchProtection }: any) {
  const octo = {
    pulls: {
      async get(_params: any) {
        return { data: pr }
      },
      async listFiles(_params: any) {
        return { data: prFiles, headers: {}, status: 200 }
      },
      async listCommits(_params: any) {
        return { data: prCommits, headers: {}, status: 200 }
      },
    },
    paginate: async (fn: any, _params: any) => {
      if (fn === (octo as any).pulls.listFiles) return prFiles
      if (fn === (octo as any).pulls.listCommits) return prCommits
      return []
    },
    repos: {
      async getContent() {
        if (!codeowners) throw Object.assign(new Error('no file'), { status: 404 })
        return { data: { content: Buffer.from(codeowners).toString('base64') } }
      },
      async compareCommits() {
        return { data: compare }
      },
      async getBranchProtection() {
        if (branchProtection) return { data: branchProtection }
        throw Object.assign(new Error('forbidden'), { status: 403 })
      },
    },
  }
  return octo
}

describe('enrichGithubEvent (GitHub provider)', () => {
  it('PR enrichment adds pr fields and owners', async () => {
    const pr = {
      number: 1,
      state: 'open',
      merged: false,
      draft: false,
      base: { ref: 'main' },
      head: { ref: 'feat' },
      changed_files: 2,
      additions: 10,
      deletions: 2,
      mergeable_state: 'dirty',
      labels: [{ name: 'documentation' }, { name: 'testing' }],
      requested_reviewers: [{ login: 'alice' }],
      requested_teams: [{ slug: 'backend' }],
    }
    const prFiles = [
      { filename: 'src/a.js', status: 'modified', additions: 5, deletions: 1, changes: 6 },
      { filename: 'README.md', status: 'added', additions: 5, deletions: 1, changes: 6 },
    ]
    const prCommits = [{ sha: 'abc', commit: { message: 'x' } }]
    const compare = {}
    const codeowners = 'src/** @team-a\nREADME.md @docs'
    const mock = makeMockOctokit({ pr, prFiles, prCommits, compare, codeowners, branchProtection: { enabled: true } })

    const event = { repository: { full_name: 'a5c-ai/events' }, pull_request: { number: 1 } }
    const out: any = await enrichGithubEvent(event, { token: 't', octokit: mock, fileLimit: 50, commitLimit: 50 })
    expect(out._enrichment.pr.number).toBe(1)
    expect(out._enrichment.pr.files.length).toBe(2)
    expect(out._enrichment.pr.owners['src/a.js']).toEqual(['@team-a'])
    expect(out._enrichment.pr.owners['README.md']).toEqual(['@docs'])
    // labels and reviewers
    expect(out._enrichment.pr.labels.sort()).toEqual(['documentation', 'testing'])
    expect(out._enrichment.pr.requested_reviewers).toEqual(['alice'])
    expect(out._enrichment.pr.requested_teams).toEqual(['backend'])
    // has_conflicts derived from mergeable_state
    expect(out._enrichment.pr.mergeable_state).toBe('dirty')
    expect(out._enrichment.pr.has_conflicts).toBe(true)
  })

  it('Push enrichment adds commits and files', async () => {
    const compare = {
      total_commits: 1,
      commits: [{ sha: 'abc', commit: { message: 'm' } }],
      files: [{ filename: 'src/b.js', additions: 1, deletions: 0, changes: 1 }],
    }
    const mock = makeMockOctokit({ compare, codeowners: 'src/** @team-a' })
    const event = { repository: { full_name: 'a5c-ai/events' }, before: '111', after: '222', ref: 'refs/heads/main' }
    const out: any = await enrichGithubEvent(event, { token: 't', octokit: mock, fileLimit: 50, commitLimit: 50 })
    expect(out._enrichment.push.total_commits).toBe(1)
    expect(out._enrichment.push.files.length).toBe(1)
    expect(out._enrichment.push.owners['src/b.js']).toEqual(['@team-a'])
  })
})

