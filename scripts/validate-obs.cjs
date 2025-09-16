const Ajv = require('ajv').default
const addFormats = require('ajv-formats').default
const fs = require('fs')
const path = require('path')

function resolveInputFile() {
  const argv = process.argv.slice(2)
  // Accept: first non-flag arg, or arg after "--", else OBS_FILE, else example
  let afterDashDash = false
  for (const a of argv) {
    if (a === '--') {
      afterDashDash = true
      continue
    }
    if (afterDashDash) return a
    if (!a.startsWith('-')) return a
  }
  if (process.env.OBS_FILE && process.env.OBS_FILE.trim()) return process.env.OBS_FILE.trim()
  // Default to example in repo for local usage
  return 'docs/examples/observability.json'
}

const inputPath = resolveInputFile()

const schema = JSON.parse(
  fs.readFileSync(path.resolve('docs/specs/observability.schema.json'), 'utf8')
)
let data
try {
  data = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'))
} catch (e) {
  console.error(`Failed reading input file: ${inputPath}\n${e && e.message}`)
  process.exit(2)
}

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
// Register minimal meta-schema to satisfy $schema reference
ajv.addMetaSchema({
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
})

const validate = ajv.compile(schema)
const ok = validate(data)
if (!ok) {
  console.error(JSON.stringify(validate.errors, null, 2))
  process.exit(1)
}
console.log('schema', 'docs/specs/observability.schema.json', 'is valid for', inputPath)
process.exit(0)
