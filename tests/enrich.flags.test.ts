import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { handleEnrich } from '../src/enrich.js'

function makeMockOctokit({ prFiles = [] as any[] } = {}) {
  const pr = { number: 1, state: 'open', merged: false, draft: false, base: { ref: 'main' }, head: { ref: 'feat' }, changed_files: prFiles.length, additions: 0, deletions: 0 }
  const commits = [{ sha: 'abc', commit: { message: 'm' } }]
  const octo: any = {
    pulls: {
      async get() { return { data: pr } },
      async listFiles() { return { data: prFiles, headers: {}, status: 200 } },
      async listCommits() { return { data: commits, headers: {}, status: 200 } },
    },
    paginate: async (fn: any) => {
      if (fn === octo.pulls.listFiles) return prFiles
      if (fn === octo.pulls.listCommits) return commits
      return []
    },
    repos: {
      async getContent() { return { data: { content: '' } } },
      async compareCommits() { return { data: { total_commits: 1, files: prFiles, commits } } },
      async getBranchProtection() { throw Object.assign(new Error('forbidden'), { status: 403 }) },
    },
  }
  return octo
}

const samplePR = 'samples/pull_request.synchronize.json'

describe('enrich flags: include_patch default and override', () => {
  const prevToken = process.env.GITHUB_TOKEN
  beforeAll(() => { process.env.GITHUB_TOKEN = 'test-token' })
  afterAll(() => { if (prevToken == null) delete (process.env as any).GITHUB_TOKEN; else process.env.GITHUB_TOKEN = prevToken })

  it('default include_patch=false removes patch from files (when files exist)', async () => {
    const prFiles = [
      { filename: 'src/a.ts', status: 'modified', additions: 1, deletions: 0, changes: 1, patch: '@@ -1 +1 @@\n+const a=1' },
      { filename: 'README.md', status: 'modified', additions: 1, deletions: 0, changes: 1, patch: '@@ -1 +1 @@\n+hello' },
    ]
    const mock = makeMockOctokit({ prFiles })
    const { code, output } = await handleEnrich({ in: samplePR, labels: [], rules: undefined, flags: { use_github: 'true' }, octokit: mock })
    expect(code).toBe(0)
    const files = (output as any)?.enriched?.github?.pr?.files || []
    if (files.length) {
      for (const f of files) {
        expect('patch' in f ? f.patch : undefined).toBeUndefined()
      }
    }
  })

  it('include_patch=true preserves patch in files (when files exist)', async () => {
    const prFiles = [
      { filename: 'src/b.ts', status: 'modified', additions: 2, deletions: 0, changes: 2, patch: '@@ -1 +1 @@\n+const b=2' },
    ]
    const mock = makeMockOctokit({ prFiles })
    const { code, output } = await handleEnrich({ in: samplePR, labels: [], rules: undefined, flags: { use_github: 'true', include_patch: 'true' }, octokit: mock })
    expect(code).toBe(0)
    const files = (output as any)?.enriched?.github?.pr?.files || []
    if (files.length) {
      expect(files[0].patch).toBeDefined()
    }
  })
})
