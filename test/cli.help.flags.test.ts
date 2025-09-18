import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

describe("cli --help includes logging flags", () => {
  it("shows --log-format and --log-level", () => {
    const cli = path.resolve("dist/cli.js");
    const out = execFileSync(process.execPath, [cli, "--help"], {
      encoding: "utf8",
    });
    expect(out).toContain("--log-format");
    expect(out).toContain("--log-level");
  });
});
