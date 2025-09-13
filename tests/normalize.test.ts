import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import Ajv from 'ajv'
// Inline minimal 2020-12 meta-schema so Ajv can compile referenced schema
const meta2020 = {
  $id: 'https://json-schema.org/draft/2020-12/schema',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $vocabulary: {
    'https://json-schema.org/draft/2020-12/vocab/core': true,
    'https://json-schema.org/draft/2020-12/vocab/applicator': true,
    'https://json-schema.org/draft/2020-12/vocab/unevaluated': true,
    'https://json-schema.org/draft/2020-12/vocab/validation': true,
    'https://json-schema.org/draft/2020-12/vocab/meta-data': true,
    'https://json-schema.org/draft/2020-12/vocab/format-annotation': true,
    'https://json-schema.org/draft/2020-12/vocab/content': true
  },
  type: ['object', 'boolean']
} as const
// vitest/vite sometimes fails to resolve ajv-formats with ESM. Inline minimal date-time format.
function addFormats(ajv: any) {
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (s: string) => /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s)
  })
  return ajv
}
import { handleNormalize } from '../src/normalize.js'

const schemaPath = path.resolve('docs/specs/ne.schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
// ensure meta registered
ajv.addMetaSchema(meta2020 as any)
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
