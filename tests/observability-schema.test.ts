import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";

// Inline minimal 2020-12 meta-schema to satisfy Ajv strict mode
const meta2020 = {
  $id: "https://json-schema.org/draft/2020-12/schema",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $vocabulary: {
    "https://json-schema.org/draft/2020-12/vocab/core": true,
    "https://json-schema.org/draft/2020-12/vocab/applicator": true,
    "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
    "https://json-schema.org/draft/2020-12/vocab/validation": true,
    "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
    "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
    "https://json-schema.org/draft/2020-12/vocab/content": true,
  },
  type: ["object", "boolean"],
} as const;

describe("observability.schema.json", () => {
  it("validates the example docs/examples/observability.json", () => {
    const schema = JSON.parse(
      fs.readFileSync("docs/specs/observability.schema.json", "utf8"),
    );
    const data = JSON.parse(
      fs.readFileSync("docs/examples/observability.json", "utf8"),
    );
    const ajv = new Ajv({ strict: true, allErrors: true });
    // @ts-ignore meta schema type mismatch acceptable for test env
    ajv.addMetaSchema(meta2020);
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const ok = validate(data);
    if (!ok) {
      const errs = (validate.errors || [])
        .map((e) => `${e.instancePath} ${e.message}`)
        .join("\n");
      throw new Error("Schema validation failed:\n" + errs);
    }
    expect(ok).toBe(true);
  });
});
