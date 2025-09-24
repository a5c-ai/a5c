import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import fs from "node:fs";

function runCli(args: string[]) {
  const tsx = resolve("node_modules/.bin/tsx");
  const cli = resolve("src/cli.ts");
  const res = spawnSync(tsx, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env },
    cwd: process.cwd(),
  });
  if (res.status !== 0) {
    throw new Error(
      `CLI exited with code ${res.status}:\n${res.stderr}\n${res.stdout}`,
    );
  }
  return res.stdout.trim();
}

describe("CLI version", () => {
  it("`a5c version` matches package.json version", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const out = runCli(["version"]);
    expect(out).toBe(pkg.version);
  });
});
