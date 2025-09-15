import { describe, it, expect } from "vitest";
// Use Ajv 2020 instance to include Draft 2020-12 meta-schema support
// This avoids: "no schema with key or ref 'https://json-schema.org/draft/2020-12/schema'"
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";

describe("observability.json schema v0.1", () => {
  const schemaPath = path.resolve("docs/specs/observability.schema.json");
  const examplePath = path.resolve("docs/examples/observability.json");

  it("validates the provided example artifact", () => {
    const ajv = new Ajv2020({
      strict: true,
      allErrors: true,
      allowUnionTypes: true,
    });
    addFormats(ajv);
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const validate = ajv.compile(schema);
    const data = JSON.parse(fs.readFileSync(examplePath, "utf8"));
    const ok = validate(data);
    if (!ok) {
      // Helpful output if this fails in CI

      console.error("Schema errors:", validate.errors);
    }
    expect(ok).toBe(true);
  });
});
