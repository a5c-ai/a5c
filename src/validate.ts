import Ajv, { type ErrorObject } from 'ajv'
import fs from 'node:fs'
import path from 'node:path'

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
    'https://json-schema.org/draft/2020-12/vocab/content': true,
  },
  type: ['object', 'boolean'],
} as const

function addFormats(ajv: any) {
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (s: string) => /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s),
  })
  return ajv
}

let cached: { ajv: Ajv; validate: any } | null = null

function getValidator() {
  if (cached) return cached
  const schemaPath = path.resolve('docs/specs/ne.schema.json')
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
  const ajv = new Ajv({ strict: false, allErrors: true })
  addFormats(ajv)
  ajv.addMetaSchema(meta2020 as any)
  const validate = ajv.compile(schema)
  cached = { ajv, validate }
  return cached
}

export async function validateNE(data: unknown): Promise<{ valid: boolean; errors: ErrorObject[] | null | undefined }>{
  const { validate } = getValidator()
  const ok = validate(data)
  return { valid: !!ok, errors: validate.errors }
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'No validation errors.'
  return errors
    .map((e) => {
      const inst = e.instancePath || e.schemaPath || ''
      const loc = inst.replace(/\btoken\b|secret|password|pass|key/gi, '[REDACTED]')
      const params = e.params ? JSON.stringify(e.params) : ''
      return `- ${e.message || 'error'} at ${loc} ${params}`.trim()
    })
    .join('\n')
}
