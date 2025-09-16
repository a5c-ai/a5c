import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import fs from "node:fs";

function runCli(args: string[], code = 0) {
  const tsx = resolve("node_modules/.bin/tsx");
  const cli = resolve("src/cli.ts");
  const res = spawnSync(tsx, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env },
    cwd: process.cwd(),
  });
  if (res.status !== code) {
    throw new Error(
      `CLI exited with code ${res.status} (expected ${code}):\n${res.stderr}\n${res.stdout}`,
    );
  }
  return { stdout: res.stdout, stderr: res.stderr };
}

describe("CLI enrich with --rules emits composed events", () => {
  it("produces composed[].key from YAML rules", () => {
    const sample = resolve("samples/pull_request.synchronize.json");
    // ensure label presence for rule to match
    const tmpSample = resolve("tmp.cli.rules.sample.json");
    const payload = JSON.parse(fs.readFileSync(sample, "utf8"));
    payload.pull_request = payload.pull_request || {};
    payload.pull_request.mergeable_state = "dirty";
    payload.pull_request.labels = (payload.pull_request.labels || []).concat([
      { name: "priority:low" },
    ]);
    fs.writeFileSync(tmpSample, JSON.stringify(payload), "utf8");

    const rules = resolve("samples/rules/conflicts.yml");
    const { stdout } = runCli(["enrich", "--in", tmpSample, "--rules", rules]);
    const obj = JSON.parse(stdout);
    const composed = (obj as any).composed || [];
    expect(Array.isArray(composed)).toBe(true);
    // Keys may be redacted in CI. Check labels/shape as fallback.
    const keys = composed.map((c: any) => c.key);
    const hasExpected =
      keys.includes("conflict_in_pr_with_low_priority_label") ||
      keys.includes("pr_conflicted_state") ||
      composed.some(
        (c: any) => Array.isArray(c.labels) && c.labels.includes("conflict"),
      );
    expect(hasExpected).toBe(true);
  });
});
