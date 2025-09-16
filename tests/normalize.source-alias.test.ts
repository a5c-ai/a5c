import { describe, it, expect } from "vitest";
import { runNormalize as runNormalizeImpl } from "../src/commands/normalize.js";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Ensure that passing --source actions (plural) results in provenance.source==='action' (singular)
// per the schema enum and product requirement in issue #566. Cover both API and CLI.

describe("normalize --source actions alias", () => {
  it("API: coerces actions -> action in provenance", async () => {
    const { code, output } = await runNormalizeImpl({
      in: "samples/workflow_run.completed.json",
      source: "actions",
      labels: [],
    });
    expect(code).toBe(0);
    expect(output?.provenance?.source).toBe("action");
  });

  it("CLI (dev tsx): accepts --source actions and persists action", () => {
    const tsx = resolve("node_modules/.bin/tsx");
    const cli = resolve("src/cli.ts");
    const res = spawnSync(
      tsx,
      [
        cli,
        "normalize",
        "--in",
        "samples/push.json",
        "--source",
        "actions",
        "--select",
        "provenance.source",
      ],
      {
        encoding: "utf8",
      },
    );
    if (res.status !== 0) {
      throw new Error(
        `CLI exited ${res.status}:\n${res.stderr}\n${res.stdout}`,
      );
    }
    const obj = JSON.parse(res.stdout);
    expect(obj.provenance?.source).toBe("action");
  });

  it("CLI (built): accepts --source actions and persists action", () => {
    const out = execFileSync(
      "node",
      [
        "dist/cli.js",
        "normalize",
        "--in",
        "samples/push.json",
        "--source",
        "actions",
        "--select",
        "provenance.source",
      ],
      { encoding: "utf8" },
    );
    const obj = JSON.parse(out);
    expect(obj.provenance?.source).toBe("action");
  });
});
