import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { CodexStdoutParser, type CodexEvent } from "../src/commands/parse.js";

function parseAllLines(text: string): CodexEvent[] {
  const parser = new CodexStdoutParser();
  const events: CodexEvent[] = [];
  for (const line of text.split(/\r?\n/)) {
    const evs = parser.parseLine(line);
    events.push(...evs);
  }
  const tail: CodexEvent[] = [];
  parser.flushIfAny(tail);
  events.push(...tail);
  return events;
}

describe("CodexStdoutParser (unit)", () => {
  const samplePath = path.resolve("example/codex_run_example_stdout.txt");
  const SAMPLE = fs.readFileSync(samplePath, "utf8");

  it("parses banner and tokens used events", () => {
    const events = parseAllLines(SAMPLE);
    expect(events[0].type).toBe("banner");
    expect(String(events[0].fields?.version || "")).toContain("0.31.0");
    const tokens = events.filter((e) => e.type === "tokens_used");
    const counts = tokens.map((t) => (t.fields?.tokens as number) || 0);
    expect(counts).toContain(6037);
    expect(counts).toContain(7442);
    expect(counts).toContain(9301);
    expect(counts).toContain(9836);
  });

  it("parses exec + exec_result with success and body", () => {
    const events = parseAllLines(SAMPLE);
    const execResult = events.find(
      (e) => e.type === "exec_result" && /bash -lc 'ls -la'/.test(String(e.fields?.command || "")),
    );
    expect(execResult).toBeTruthy();
    expect(execResult?.fields?.status).toBe("succeeded");
    expect(String(execResult?.raw || "")).toContain("total 6156");
    expect(typeof execResult?.fields?.durationMs).toBe("number");
  });

  it("parses exec_result for failure with exit code and stderr text", () => {
    const events = parseAllLines(SAMPLE);
    const failed = events.find(
      (e) => e.type === "exec_result" && /npm test --silent/.test(String(e.fields?.command || "")),
    );
    expect(failed).toBeTruthy();
    expect(failed?.fields?.status).toBe("exited");
    expect(failed?.fields?.exitCode).toBe(2);
    expect(String(failed?.raw || "")).toContain("error TS2688");
  });

  it("adds thought/explanation fields for thinking/codex", () => {
    const events = parseAllLines(SAMPLE);
    const thinking = events.find((e) => e.type === "thinking");
    const codex = events.find((e) => e.type === "codex");
    expect(String(thinking?.fields?.thought || "")).toContain("Exploring user request");
    expect(String(codex?.fields?.explanation || "")).toContain("scan the repo");
  });
});


