import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

describe("observability.schema.json", () => {
  it("validates docs/examples/observability.json", () => {
    const schemaPath = path.join("docs", "specs", "observability.schema.json");
    const examplePath = path.join("docs", "examples", "observability.json");
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const data = JSON.parse(fs.readFileSync(examplePath, "utf8"));
    const ajv = new Ajv2020({
      strict: false,
      allowUnionTypes: true,
      allErrors: true,
    });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const ok = validate(data);
    if (!ok) {
      // Surface helpful output on failure

      console.error(validate.errors);
    }
    expect(ok).toBe(true);
  });
});
