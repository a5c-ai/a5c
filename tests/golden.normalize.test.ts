import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { handleNormalize } from '../src/normalize.js'
import { stable } from './helpers/snapshot.js'

const GOLDENS_DIR = path.resolve('tests/fixtures/goldens')

async function run(sample: string) {
  const { output } = await handleNormalize({ in: sample, source: 'cli', labels: ['env=test'] })
  return stable(output)
}

function readGolden(name: string) {
  const p = path.join(GOLDENS_DIR, name)
  return JSON.parse(readFileSync(p, 'utf8'))
}

describe('golden normalize', () => {
  const cases = [
    'workflow_run.completed.normalize.json',
    'pull_request.synchronize.normalize.json',
    'push.normalize.json',
    'issue_comment.created.normalize.json',
  ]

  for (const c of cases) {
    it(`matches ${c}`, async () => {
      const sample = path.resolve('samples', c.replace('.normalize.json', '.json'))
      const got = await run(sample)
      const want = readGolden(c)
      expect(got).toEqual(want)
    })
  }
})

