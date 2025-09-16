import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function runCli(args: string[], expectCode = 0) {
  const tsx = resolve("node_modules/.bin/tsx");
  const cli = resolve("src/cli.ts");
  const res = spawnSync(tsx, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env },
    cwd: process.cwd(),
  });
  if (res.status !== expectCode) {
    throw new Error(
      `CLI exited with code ${res.status} (expected ${expectCode}):\n${res.stderr}\n${res.stdout}`,
    );
  }
  return res.stdout;
}

describe("CLI select/filter", () => {
  it("normalize --select type,repo.full_name", () => {
    const sample = resolve("samples/push.json");
    const out = runCli([
      "normalize",
      "--in",
      sample,
      "--select",
      "type,repo.full_name",
    ]);
    const obj = JSON.parse(out);
    expect(Object.keys(obj)).toEqual(["type", "repo"]);
    expect(obj.repo.full_name).toBeTruthy();
    expect(obj.type).toBeTruthy();
  });

  it("enrich --filter enriched.github.pr.mergeable_state=dirty (may be filtered depending on enrichment)", () => {
    const sample = resolve("samples/pull_request.synchronize.json");
    // If enrichment not performed, condition likely fails -> exit 2
    runCli(
      [
        "enrich",
        "--in",
        sample,
        "--filter",
        "enriched.github.pr.mergeable_state=dirty",
      ],
      2,
    );
  });
});
