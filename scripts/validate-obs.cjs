// Minimal AJV-based validator for Observability example
const Ajv = require('ajv').default
const addFormats = require('ajv-formats').default
const fs = require('fs')

const schema = JSON.parse(
  fs.readFileSync('docs/specs/observability.schema.json', 'utf8')
)
const data = JSON.parse(
  fs.readFileSync('docs/examples/observability.json', 'utf8')
)

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
  console.error(JSON.stringify(validate.errors))
  process.exit(1)
}
process.exit(0)
