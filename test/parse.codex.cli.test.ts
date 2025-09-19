import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

describe("events parse --type codex (integration)", () => {
  const cli = path.resolve("dist/cli.js");
  const sample = path.resolve("example/codex_run_example_stdout.txt");

  it("emits JSON lines and includes tokens and exec events", () => {
    const input = fs.readFileSync(sample, "utf8");
    const out = execFileSync(process.execPath, [cli, "parse", "--type", "codex"], {
      input,
      encoding: "utf8",
    });
    const lines = out.trim().split(/\r?\n/);
    expect(lines.length).toBeGreaterThan(5);
    const objs = lines.map((l) => JSON.parse(l));
    expect(objs.some((o: any) => o.type === "banner")).toBe(true);
    expect(objs.some((o: any) => o.type === "tokens_used" && o.fields?.tokens === 6037)).toBe(true);
    expect(objs.some((o: any) => o.type === "exec")).toBe(true);
    expect(objs.some((o: any) => o.type === "exec_result" && /ls -la/.test(String(o.fields?.command || "")))).toBe(true);
  });
});


