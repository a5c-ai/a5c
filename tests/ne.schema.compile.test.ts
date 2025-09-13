import { describe, it, expect } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
// Ajv does not include the 2020-12 meta-schema automatically in some builds.
// Add it explicitly so schemas with $schema: 2020-12 compile.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - path is valid in ajv package
import meta2020 from 'ajv/dist/refs/json-schema-2020-12.json';

// This verifies the schema itself compiles under Ajv (strict mode),
// not that current outputs conform yet (blocked by #75/#76).

describe('NE schema', () => {
  it('compiles with Ajv', () => {
    const schema = JSON.parse(fs.readFileSync('docs/specs/ne.schema.json', 'utf-8'));
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    expect(typeof validate).toBe('function');
  });
});
