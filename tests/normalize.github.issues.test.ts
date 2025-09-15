import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Ajv from "ajv";
import { handleNormalize } from "../src/normalize.js";

// Minimal 2020-12 meta-schema and date-time for Ajv (kept inline for test isolation)
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

describe("GitHub issues normalization", () => {
  it('issues.opened.json → type: "issue" and schema-valid', async () => {
    const input = JSON.parse(
      fs.readFileSync(
        path.join("tests/fixtures/github", "issues.opened.json"),
        "utf8",
      ),
    );
    const tmp = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "events-test-")),
      "issue.json",
    );
    fs.writeFileSync(tmp, JSON.stringify(input));

    const { output: ev } = await handleNormalize({
      in: tmp,
      source: "webhook",
      labels: ["t=issues"],
    });
    expect(ev.type).toBe("issue");
    expect(ev.provider).toBe("github");
    expect(ev.repo?.full_name).toBe("a5c-ai/events");
    expect(typeof ev.id).toBe("string");

    // Validate against NE schema
    const schema = JSON.parse(
      fs.readFileSync("docs/specs/ne.schema.json", "utf8"),
    );
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addMetaSchema(meta2020 as any);
    const validate = ajv.compile(schema);
    const ok = validate(ev);
    if (!ok) {
      // Useful for debugging
      console.error(validate.errors);
    }
    expect(ok).toBe(true);
  });
});
