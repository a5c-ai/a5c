import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { cmdNormalize } from "../src/commands/normalize.js";
import { cmdEnrich } from "../src/commands/enrich.js";

describe("commands unit", () => {
  it("cmdNormalize returns code 2 on missing input", async () => {
    const { code, errorMessage } = (await cmdNormalize({})) as any;
    expect(code).toBe(2);
    expect(String(errorMessage || "")).toMatch(/Missing required --in/);
  });

  it("cmdNormalize reads a valid file and returns NE", async () => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "events-test-"));
    const file = path.join(tmpdir, "input.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        workflow_run: { id: 1, updated_at: "2024-06-01T00:00:00Z" },
        repository: { id: 1, name: "events", full_name: "a5c-ai/events" },
      }),
    );
    const { code, output } = (await cmdNormalize({
      in: file,
      source: "cli",
      labels: ["x=y"],
    })) as any;
    expect(code).toBe(0);
    expect(output?.provider).toBe("github");
    expect(output?.type).toBe("workflow_run");
    expect(output?.labels?.[0]).toBe("x=y");
  });

  it("cmdEnrich returns an output shell when provider is skipped", async () => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "events-test-"));
    const file = path.join(tmpdir, "input.json");
    const payload = {
      pull_request: {
        id: 2,
        updated_at: "2024-06-01T00:00:00Z",
        base: { ref: "a5c/main" },
        head: { ref: "feat/x" },
      },
      repository: { id: 1, name: "events", full_name: "a5c-ai/events" },
    };
    fs.writeFileSync(file, JSON.stringify(payload));
    const { code, output } = (await cmdEnrich({
      in: file,
      labels: ["a=b"],
      flags: {},
    })) as any;
    expect(code).toBe(0);
    expect(output?.provider).toBe("github");
    expect(output?.type).toBe("pull_request");
    expect(output?.enriched?.github).toBeTruthy();
  });
});
