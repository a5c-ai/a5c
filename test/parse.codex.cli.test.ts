import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

describe("events parse --type codex (integration)", () => {
  const cli = path.resolve("dist/cli.js");
  const sample = path.resolve("example/codex_run_example_stdout.txt");

  it("emits JSON lines and includes tokens and exec events", () => {
    const input = fs.readFileSync(sample, "utf8");
    const out = execFileSync(
      process.execPath,
      [cli, "parse", "--type", "codex"],
      {
        input,
        encoding: "utf8",
      },
    );
    const lines = out.trim().split(/\r?\n/);
    expect(lines.length).toBeGreaterThan(3);
    const objs = lines.map((l) => JSON.parse(l));
    expect(objs.some((o: any) => o.type === "banner")).toBe(true);
    expect(
      objs.some(
        (o: any) => o.type === "tokens_used" && o.fields?.tokens === 6037,
      ),
    ).toBe(true);
    expect(objs.some((o: any) => o.type === "exec")).toBe(true);
    expect(
      objs.some(
        (o: any) =>
          o.type === "exec_result" &&
          /bash -lc 'ls -la'/.test(String(o.fields?.command || "")),
      ),
    ).toBe(true);
    const er = objs.find(
      (o: any) =>
        o.type === "exec_result" &&
        /bash -lc 'ls -la'/.test(String(o.fields?.command || "")),
    );
    expect(String(er?.fields?.result || "")).toContain("total 6156");
    const thinking = objs.find((o: any) => o.type === "thinking");
    const codex = objs.find((o: any) => o.type === "codex");
    expect(String(thinking?.fields?.thought || "")).toContain(
      "Exploring user request",
    );
    expect(String(codex?.fields?.explanation || "")).toContain("scan the repo");
  });

  it("writes JSONL to file with --out while pretty-printing to stdout", () => {
    const input = fs.readFileSync(sample, "utf8");
    const tmp = path.resolve(".tmp-parsed.jsonl");
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
    const out = execFileSync(
      process.execPath,
      [cli, "parse", "--type", "codex", "--out", tmp, "--pretty"],
      {
        input,
        encoding: "utf8",
      },
    );
    // stdout should be pretty (multiple lines for single objects)
    expect(out.split(/\r?\n/).filter(Boolean).length).toBeGreaterThan(10);
    // file should contain raw jsonl
    const file = fs.readFileSync(tmp, "utf8");
    const fileLines = file.trim().split(/\r?\n/);
    expect(fileLines.length).toBeGreaterThan(3);
    // Ensure lines are valid JSON and no pretty indentation
    for (const l of fileLines) {
      const obj = JSON.parse(l);
      expect(typeof obj).toBe("object");
    }
  });
});
