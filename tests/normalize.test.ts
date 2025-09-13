import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { handleNormalize } from '../src/normalize.js'

const schemaPath = path.resolve('docs/specs/ne.schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
const validate = ajv.compile(schema)

async function run(sample: string, type: string) {
  const { output } = await handleNormalize({ in: sample, source: 'cli', labels: ['env=dev'] })
  expect(output.type).toBe(type)
  const ok = validate(output)
  if (!ok) {
    // eslint-disable-next-line no-console
    console.error(validate.errors)
  }
  expect(ok).toBe(true)
}

describe('normalize()', () => {
  it('workflow_run sample validates', async () => {
    await run(path.resolve('samples/workflow_run.completed.json'), 'workflow_run')
  })

  it('pull_request sample validates', async () => {
    await run(path.resolve('samples/pull_request.synchronize.json'), 'pull_request')
  })

  it('push sample validates', async () => {
    await run(path.resolve('samples/push.json'), 'push')
  })

  it('issue_comment sample validates', async () => {
    await run(path.resolve('samples/issue_comment.created.json'), 'issue_comment')
  })
})
