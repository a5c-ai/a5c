#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

function usage() {
  console.error(
    "Usage: npm run validate:obs -- <file> [--schema <schemaPath>]",
  );
}

async function main() {
  const args = process.argv.slice(2);
  let file = null;
  let schemaPath = path.join("docs", "specs", "observability.schema.json");
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!file && !a.startsWith("--")) {
      file = a;
      continue;
    }
    if (a === "--schema") {
      schemaPath = args[++i];
      continue;
    }
  }
  if (!file) {
    // Default example path when no file is provided (aligns with repo tests)
    file = path.join("docs", "examples", "observability.json");
  }

  const ajv = new Ajv2020({
    strict: false,
    allowUnionTypes: true,
    allErrors: true,
  });
  addFormats(ajv);

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (e) {
    console.error(`Failed to read schema at ${schemaPath}:`, e.message);
    process.exit(2);
  }
  const validate = ajv.compile(schema);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`Failed to read JSON file ${file}:`, e.message);
    process.exit(2);
  }
  const ok = validate(data);
  if (!ok) {
    console.error("Observability JSON validation failed:");
    for (const err of validate.errors ?? []) {
      console.error(` - ${err.instancePath || "/"} ${err.message}`);
    }
    process.exit(1);
  }
  console.log("Observability JSON is valid.");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
