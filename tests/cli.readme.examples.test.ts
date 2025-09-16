import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";

function run(cmd: string, opts: any = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts });
}

describe("README examples", () => {
  it("normalizes sample workflow_run and writes out.json", () => {
    if (fs.existsSync("out.json")) fs.unlinkSync("out.json");
    run(
      "node dist/cli.js normalize --in samples/workflow_run.completed.json --out out.json",
    );
    const out = JSON.parse(fs.readFileSync("out.json", "utf8"));
    expect(out).toBeTypeOf("object");
    expect(out).toHaveProperty("payload");
    // cleanup demo artifact to avoid polluting workspace
    fs.unlinkSync("out.json");
  });

  it("extracts mentions from stdin", () => {
    const text = "route to @developer-agent and @validator-agent";
    const json = run(
      `printf "%s" "$MSG" | node dist/cli.js mentions --source issue_comment`,
      {
        env: { ...process.env, MSG: text },
      },
    );
    const arr = JSON.parse(json);
    const targets = arr.map((m: any) => m.normalized_target);
    expect(targets).toContain("developer-agent");
    expect(targets).toContain("validator-agent");
  });
});
