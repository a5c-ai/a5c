#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const schemaPath = path.join(root, 'docs', 'specs', 'observability.schema.json');
const examplePath = path.join(root, 'docs', 'examples', 'observability.json');

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const schema = loadJSON(schemaPath);
  const example = loadJSON(examplePath);
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(example);
  if (!valid) {
    console.error('observability.json example does not match schema');
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }
  console.log('observability example is valid against schema v0.1');
}

main();
