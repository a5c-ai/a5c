import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// Import module under test
import { cmdNormalize } from "../src/commands/normalize.js";
// Import the map module as a namespace so we can spy on mapToNE
import * as mapMod from "../src/providers/github/map.ts";

describe("cmdNormalize -> delegates to mapToNE", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ne-test-"));
  const tmpFile = path.join(tmpDir, "event.json");

  beforeEach(() => {
    // Fresh payload per test
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({ pull_request: { number: 123 } }),
      "utf8",
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls mapToNE with payload and normalized source", async () => {
    const fakeNE: any = {
      id: "123",
      provider: "github",
      type: "pull_request",
      occurred_at: new Date().toISOString(),
      payload: { ok: true },
      labels: ["t"],
      provenance: { source: "action" },
    };

    const spy = vi.spyOn(mapMod, "mapToNE").mockImplementation(() => fakeNE);

    const res = await cmdNormalize({
      in: tmpFile,
      source: "actions", // should normalize to "action"
      labels: ["t"],
    });

    expect(res.code).toBe(0);
    expect(res.output).toEqual(fakeNE);
    expect(spy).toHaveBeenCalledTimes(1);
    const [payloadArg, optsArg] = spy.mock.calls[0];
    expect(payloadArg).toEqual({ pull_request: { number: 123 } });
    expect(optsArg).toEqual({ source: "action", labels: ["t"] });
  });
});
