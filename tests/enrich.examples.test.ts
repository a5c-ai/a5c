import fs from "fs";
import path from "path";
import Ajv from "ajv";

// Inline draft 2020-12 meta-schema (kept minimal in tests to avoid ESM import issues)
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

function addFormats(ajv: any) {
  ajv.addFormat("date-time", {
    type: "string",
    validate: (s: string) => /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s),
  });
  return ajv;
}

describe("Enrich examples validate against NE schema", () => {
  const schema = JSON.parse(
    fs.readFileSync(path.resolve("docs/specs/ne.schema.json"), "utf-8"),
  );

  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addMetaSchema(meta2020 as any);

  const validate = ajv.compile(schema);

  const examples = [
    "docs/examples/enrich.offline.json",
    "docs/examples/enrich.online.json",
  ];

  for (const ex of examples) {
    it(`${ex} conforms to NE schema`, () => {
      const data = JSON.parse(fs.readFileSync(path.resolve(ex), "utf-8"));
      const ok = validate(data);
      if (!ok) {
        // Improve failure output for debugging in CI
        const errors = (validate.errors || [])
          .map((e) => `${e.instancePath} ${e.message}`)
          .join("\n");
        throw new Error(`Schema validation failed for ${ex}:\n${errors}`);
      }
    });
  }
});
