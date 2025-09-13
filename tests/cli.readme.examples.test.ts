import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { resolve } from "node:path";

function runCli(args: string[], opts: { input?: string } = {}) {
  const tsx = resolve("node_modules/.bin/tsx");
  const cli = resolve("src/cli.ts");
  const res = spawnSync(tsx, [cli, ...args], {
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf8",
    input: opts.input ?? undefined,
    env: { ...process.env },
    cwd: process.cwd(),
  });
  if (res.status !== 0) {
    throw new Error(
      `CLI exited with code ${res.status}:\n${res.stderr}\n${res.stdout}`,
    );
  }
  return res.stdout;
}

describe("README examples", () => {
  it("normalizes sample workflow_run and writes out.json", () => {
    if (fs.existsSync("out.json")) fs.unlinkSync("out.json");
    runCli([
      "normalize",
      "--in",
      "samples/workflow_run.completed.json",
      "--out",
      "out.json",
    ]);
    const out = JSON.parse(fs.readFileSync("out.json", "utf8"));
    expect(out).toBeTypeOf("object");
    expect(out).toHaveProperty("payload");
    // cleanup demo artifact to avoid polluting workspace
    fs.unlinkSync("out.json");
  });

  it("extracts mentions from stdin", () => {
    const text = "route to @developer-agent and @validator-agent";
    const json = runCli(["mentions", "--source", "issue_comment"], {
      input: text,
    });
    const arr = JSON.parse(json);
    const targets = arr.map((m: any) => m.normalized_target);
    expect(targets).toContain("developer-agent");
    expect(targets).toContain("validator-agent");
  });
});
