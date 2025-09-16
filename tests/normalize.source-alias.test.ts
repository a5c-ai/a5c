import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { handleNormalize } from "../src/normalize.js";

const fixture = path.join("samples", "push.json");

describe("normalize: --source alias normalization", () => {
  it("treats --source actions as action in provenance.source", async () => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "events-test-"));
    const tmp = path.join(tmpdir, "in.json");
    const payload = JSON.parse(fs.readFileSync(fixture, "utf8"));
    fs.writeFileSync(tmp, JSON.stringify(payload));
    const { output } = await handleNormalize({ in: tmp, source: "actions" });
    expect(output.provenance?.source).toBe("action");
  });

  it("preserves canonical value when source is action", async () => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "events-test-"));
    const tmp = path.join(tmpdir, "in.json");
    const payload = JSON.parse(fs.readFileSync(fixture, "utf8"));
    fs.writeFileSync(tmp, JSON.stringify(payload));
    const { output } = await handleNormalize({ in: tmp, source: "action" });
    expect(output.provenance?.source).toBe("action");
  });
});
