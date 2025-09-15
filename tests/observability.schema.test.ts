import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";

describe("observability.json schema v0.1", () => {
  const schemaPath = path.resolve("docs/specs/observability.schema.json");
  const examplePath = path.resolve("docs/examples/observability.json");

  it("validates the provided example artifact", () => {
    const ajv = new Ajv({ strict: true, allErrors: true });
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
