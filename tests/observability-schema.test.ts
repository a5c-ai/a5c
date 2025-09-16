import { describe, it, expect } from "vitest";
import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

describe("observability.schema.json", () => {
  it("validates docs/examples/observability.json", () => {
    const schema = JSON.parse(
      fs.readFileSync("docs/specs/observability.schema.json", "utf8"),
    );
    const data = JSON.parse(
      fs.readFileSync("docs/examples/observability.json", "utf8"),
    );
    const ajv = new Ajv2020({
      strict: true,
      allowUnionTypes: true,
      allErrors: true,
    });
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

  it("parses enrich examples (offline/online) and validates basic NE shape", () => {
    const offline = JSON.parse(
      fs.readFileSync("docs/examples/enrich.offline.json", "utf8"),
    );
    const online = JSON.parse(
      fs.readFileSync("docs/examples/enrich.online.json", "utf8"),
    );
    expect(offline).toBeTypeOf("object");
    expect(online).toBeTypeOf("object");
    for (const obj of [offline, online]) {
      expect(obj).toHaveProperty("provider");
      expect(obj).toHaveProperty("type");
      expect(obj).toHaveProperty("repo");
      expect(obj).toHaveProperty("actor");
      expect(obj).toHaveProperty("payload");
      expect(obj).toHaveProperty("provenance");
    }
    expect(offline.enriched?.github?.partial).toBe(true);
    expect(offline.enriched?.github?.reason).toBe("flag:not_set");
  });
});
