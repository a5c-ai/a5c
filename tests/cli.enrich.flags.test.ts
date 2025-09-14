import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { handleEnrich } from '../src/enrich.js'

// Build a minimal PR-shaped event to trigger PR enrichment code path in enrichGithubEvent
function makePREvent() {
  return {
    repository: { full_name: 'a5c-ai/events' },
    pull_request: { number: 1, base: { ref: 'main' }, head: { ref: 'feat' } },
  }
}

function writeJsonTmp(obj: any): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a5c-events-'))
  const file = path.join(dir, 'event.json')
  fs.writeFileSync(file, JSON.stringify(obj), 'utf8')
  return file
}

// Mock Octokit that returns one file with a patch in PR files
function makeMockOctokit() {
  const pr = { number: 1, state: 'open', merged: false, draft: false, base: { ref: 'main' }, head: { ref: 'feat' }, changed_files: 1, additions: 1, deletions: 0 }
  const prFiles = [
    { filename: 'src/a.js', status: 'modified', additions: 1, deletions: 0, changes: 1, patch: '+line' },
  ]
  const prCommits = [{ sha: 'abc', commit: { message: 'test' } }]
  const compare = {}

  const octo = {
    pulls: {
      async get() { return { data: pr } },
      async listFiles() { return { data: prFiles, headers: {}, status: 200 } },
      async listCommits() { return { data: prCommits, headers: {}, status: 200 } },
    },
    paginate: async (fn: any) => {
      if (fn === (octo as any).pulls.listFiles) return prFiles
      if (fn === (octo as any).pulls.listCommits) return prCommits
      return []
    },
    repos: {
      async getContent() { return { data: { content: Buffer.from('src/** @team').toString('base64') } } },
      async compareCommits() { return { data: compare } },
      async getBranchProtection() { throw Object.assign(new Error('forbidden'), { status: 403 }) },
    },
  }
  return octo
}

describe('enrich flags: include_patch', () => {
  it('include_patch=true keeps patch fields (when files exist)', async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN
    process.env.A5C_AGENT_GITHUB_TOKEN = 'test-token'
    const event = makePREvent()
    const mock = makeMockOctokit()
    const inFile = writeJsonTmp(event)
    const { output } = await handleEnrich({ in: inFile, labels: [], rules: undefined, flags: { include_patch: 'true', use_github: 'true' }, octokit: mock as any })
    const files = (output.enriched as any)?.github?.pr?.files || []
    if (files.length) {
      expect(files[0].patch).toBeDefined()
    }
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN; else process.env.A5C_AGENT_GITHUB_TOKEN = prev
  })

  it('include_patch=false removes patch fields (when files exist)', async () => {
    const prev = process.env.A5C_AGENT_GITHUB_TOKEN
    process.env.A5C_AGENT_GITHUB_TOKEN = 'test-token'
    const event = makePREvent()
    const mock = makeMockOctokit()
    const inFile = writeJsonTmp(event)
    const { output } = await handleEnrich({ in: inFile, labels: [], rules: undefined, flags: { include_patch: 'false', use_github: 'true' }, octokit: mock as any })
    const files = (output.enriched as any)?.github?.pr?.files || []
    if (files.length) {
      expect(files[0].patch).toBeUndefined()
    }
    if (prev === undefined) delete process.env.A5C_AGENT_GITHUB_TOKEN; else process.env.A5C_AGENT_GITHUB_TOKEN = prev
  })
})
