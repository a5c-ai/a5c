import Ajv, { type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
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

export type ValidationResult = {
  valid: boolean
  errors: ErrorObject[]
}

type AjvValidate = ((data: unknown) => boolean) & { errors?: ErrorObject[] }
let cachedValidate: AjvValidate | null = null

export function buildAjv() {
  const ajv = new Ajv({ strict: false, allErrors: true })
  // Provide date-time and other formats (Ajv v8+)
  addFormats(ajv as any)
  // Ensure 2020-12 meta-schema available when $schema references it
  // @ts-ignore – Ajv types accept this at runtime
  ajv.addMetaSchema(meta2020)
  return ajv
}

export function loadSchema(): any {
  // Resolve schema relative to project root when running from source.
  // dist/* files live one level deeper; attempt a few roots.
  const candidates = [
    path.resolve('docs/specs/ne.schema.json'),
    path.resolve(process.cwd(), 'docs/specs/ne.schema.json'),
    // When running from dist, project root is one level up from dist
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../docs/specs/ne.schema.json'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../docs/specs/ne.schema.json'),
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8')
        return JSON.parse(raw)
      }
    } catch {
      // try next
    }
  }
  throw new Error('NE schema not found: docs/specs/ne.schema.json')
}

export function getValidator(): AjvValidate {
  if (cachedValidate) return cachedValidate
  const schema = loadSchema()
  const ajv = buildAjv()
  cachedValidate = ajv.compile(schema) as AjvValidate
  return cachedValidate
}

export function validateNE(data: unknown): ValidationResult {
  const validate = getValidator()
  const valid = validate(data)
  const errors = (validate.errors || []) as ErrorObject[]
  return { valid: !!valid, errors }
}

export function formatErrors(errors: ErrorObject[]): string[] {
  const lines: string[] = []
  for (const err of errors) {
    // Prefer instancePath when available; for required, append missingProperty
    let pathStr = err.instancePath || ''
    if (!pathStr && (err.params as any)?.missingProperty) pathStr = '/' + (err.params as any).missingProperty
    // Ensure non-empty
    if (!pathStr) pathStr = '/'
    const msg = err.message || 'validation error'
    lines.push(`${pathStr}: ${msg}`)
  }
  return lines
}
