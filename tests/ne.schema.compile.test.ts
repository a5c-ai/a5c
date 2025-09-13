import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
function addFormats(ajv: any) {
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (s: string) => /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s)
  })
  return ajv
}
import fs from 'node:fs';
// Ajv does not include the 2020-12 meta-schema automatically in some builds.
// Add it explicitly so schemas with $schema: 2020-12 compile.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - path is valid in ajv package
// Inline 2020-12 meta-schema to avoid ESM path issues in Vite
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
} as const;

// This verifies the schema itself compiles under Ajv (strict mode),
// not that current outputs conform yet (blocked by #75/#76).

describe('NE schema', () => {
  it('compiles with Ajv', () => {
    const schema = JSON.parse(fs.readFileSync('docs/specs/ne.schema.json', 'utf-8'));
    const ajv = new Ajv({ strict: true, allErrors: true });
    addFormats(ajv);
    // ensure meta-schema for 2020-12 is available
    // @ts-ignore
    ajv.addMetaSchema(meta2020);
    const validate = ajv.compile(schema);
    expect(typeof validate).toBe('function');
  });
});
