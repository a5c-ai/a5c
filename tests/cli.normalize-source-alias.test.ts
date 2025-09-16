import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import fs from "node:fs";

function run(args: string[], input?: string) {
  const tsx = resolve("node_modules/.bin/tsx");
  const cli = resolve("src/cli.ts");
  const res = spawnSync(tsx, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env },
    cwd: process.cwd(),
    input,
  });
  return res;
}

describe("CLI normalize --source actions alias", () => {
  it('normalizes provenance.source to "action" and validates against schema', () => {
    const sample = resolve("samples/workflow_run.completed.json");
    // ensure sample exists
    expect(fs.existsSync(sample)).toBe(true);
    const res = run(["normalize", "--source", "actions", "--in", sample]);
    expect(res.status).toBe(0);
    const obj = JSON.parse(res.stdout);
    expect(obj?.provenance?.source).toBe("action");

    // Validate output against the NE schema using the built-in validate command
    const res2 = run(
      ["validate", "--schema", "docs/specs/ne.schema.json"],
      res.stdout,
    );
    expect(res2.status).toBe(0);
    const v = JSON.parse(res2.stdout);
    expect(v.valid).toBe(true);
  });
});
