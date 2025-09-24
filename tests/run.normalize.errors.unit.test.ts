import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { runNormalize } from "../src/commands/normalize.js";

describe("runNormalize (programmatic) error contract", () => {
  it("returns code 2 and errorMessage when input is missing", async () => {
    const res = await runNormalize({});
    expect(res.code).toBe(2);
    expect(res.output).toBeUndefined();
    expect(String(res.errorMessage || "")).toMatch(/Missing required input/);
  });

  it("returns code 2 and errorMessage when file is not found", async () => {
    const res = await runNormalize({ in: "/no/such/file.json", source: "cli" });
    expect(res.code).toBe(2);
    expect(res.output).toBeUndefined();
    expect(String(res.errorMessage || "")).toMatch(/Input file not found/);
  });

  it("returns code 0 and output for valid input file", async () => {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "events-test-"));
    const file = path.join(tmpdir, "input.json");
    fs.writeFileSync(
      file,
      JSON.stringify({
        workflow_run: { id: 1, updated_at: "2024-06-01T00:00:00Z" },
        repository: { id: 1, name: "a5c", full_name: "a5c-ai/a5c" },
      }),
    );
    const res = await runNormalize({ in: file, source: "cli" });
    expect(res.code).toBe(0);
    expect(res.errorMessage).toBeUndefined();
    expect(res.output?.provider).toBe("github");
    expect(res.output?.type).toBe("workflow_run");
  });
});
