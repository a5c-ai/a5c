import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import path from "node:path";

describe("observability schema v0.1", () => {
  it("validates docs/examples/observability.json", () => {
    const schemaPath = path.join(
      process.cwd(),
      "docs/schemas/observability.schema.json",
    );
    const examplePath = path.join(
      process.cwd(),
      "docs/examples/observability.json",
    );
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    const example = JSON.parse(readFileSync(examplePath, "utf8"));
    const ajv = new Ajv2020({
      strict: true,
      allErrors: true,
      allowUnionTypes: true,
    });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const ok = validate(example);
    if (!ok) {
      console.error(validate.errors);
    }
    expect(ok).toBe(true);
  });
});
