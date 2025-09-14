import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { handleEnrich } from '../src/enrich.js'
import { stable } from './helpers/snapshot.js'

const GOLDENS_DIR = path.resolve('tests/fixtures/goldens')

async function run(sample: string) {
  const { output } = await handleEnrich({ in: sample, labels: [], rules: undefined, flags: {} })
  return stable(output)
}

function readGolden(name: string) {
  const p = path.join(GOLDENS_DIR, name)
  return JSON.parse(readFileSync(p, 'utf8'))
}

describe('golden enrich', () => {
  const cases = [
    'workflow_run.completed.enrich.json',
    'pull_request.synchronize.enrich.json',
    'push.enrich.json',
    'issue_comment.created.enrich.json',
  ]

  for (const c of cases) {
    it(`matches ${c}`, async () => {
      const sample = path.resolve('samples', c.replace('.enrich.json', '.json'))
      const got = await run(sample)
      const want = readGolden(c)
      expect(got).toEqual(want)
    })
  }
})
