import { describe, it, expect } from "vitest";
import fs from "node:fs";
import Ajv from "ajv";

// Minimal Draft 2020-12 meta-schema and date-time format registration
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

describe("examples: enrich offline/online", () => {
  const schema = JSON.parse(
    fs.readFileSync("docs/specs/ne.schema.json", "utf8"),
  );
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addMetaSchema(meta2020 as any);
  const validate = ajv.compile(schema);

  it("offline and online examples validate against NE schema", () => {
    const offline = JSON.parse(
      fs.readFileSync("docs/examples/enrich.offline.json", "utf8"),
    );
    const online = JSON.parse(
      fs.readFileSync("docs/examples/enrich.online.json", "utf8"),
    );

    for (const obj of [offline, online]) {
      const ok = validate(obj);
      if (!ok) {
        const errs = (validate.errors || [])
          .map((e) => `${e.instancePath} ${e.message}`)
          .join("\n");
        throw new Error("NE schema validation failed:\n" + errs);
      }
      expect(ok).toBe(true);
    }
  });

  it("offline example still validates when enriched.github is omitted", () => {
    const offline = JSON.parse(
      fs.readFileSync("docs/examples/enrich.offline.json", "utf8"),
    );
    if (offline.enriched && offline.enriched.github)
      delete offline.enriched.github;
    const ok = validate(offline);
    if (!ok) {
      const errs = (validate.errors || [])
        .map((e) => `${e.instancePath} ${e.message}`)
        .join("\n");
      throw new Error(
        "NE schema validation failed (offline without enriched.github):\n" +
          errs,
      );
    }
    expect(ok).toBe(true);
  });
});
