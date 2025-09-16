import { describe, it, expect } from "vitest";
import { runNormalize as runNormalizeImpl } from "../src/commands/normalize.js";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

describe("normalize --source alias coercion", () => {
  it("API: coerces actions -> action in provenance", async () => {
    const { code, output } = await runNormalizeImpl({
      in: "samples/workflow_run.completed.json",
      source: "actions",
      labels: [],
    });
    expect(code).toBe(0);
    expect(output?.provenance?.source).toBe("action");
  });

  it("CLI: accepts --source actions and persists action", () => {
    const tsx = resolve("node_modules/.bin/tsx");
    const cli = resolve("src/cli.ts");
    const res = spawnSync(
      tsx,
      [
        cli,
        "normalize",
        "--in",
        "samples/workflow_run.completed.json",
        "--source",
        "actions",
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
});
