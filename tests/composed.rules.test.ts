import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";
import fs from "node:fs";
import path from "node:path";

describe("composed events via rules", () => {
  const tmpDir = path.join(process.cwd(), "tmp-tests");
  const rulesFile = path.join(tmpDir, "conflict.yml");
  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });
  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it("emits composed event with key and targets from YAML rules", async () => {
    const yaml = `
rules:
  - name: conflict_in_pr_with_low_priority_label
    on: pull_request
    when:
      all:
        - { path: "$.payload.pull_request.mergeable_state", eq: "dirty" }
        - { path: "$.payload.pull_request.labels[*].name", contains: "priority:low" }
    emit:
      key: conflict_in_pr_with_low_priority_label
      targets: [developer-agent]
      labels: [conflict, pr, priority:low]
      payload:
        pr_number: $.payload.pull_request.number
        title: $.payload.pull_request.title
`;
    fs.writeFileSync(rulesFile, yaml, "utf8");

    // augment sample to include the priority:low label
    const samplePath = path.join(
      process.cwd(),
      "samples/pull_request.synchronize.json",
    );
    const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
    sample.pull_request.mergeable_state = "dirty";
    sample.pull_request.labels = (sample.pull_request.labels || []).concat([
      { name: "priority:low" },
    ]);

    const tmpEvent = path.join(tmpDir, "event.json");
    fs.writeFileSync(tmpEvent, JSON.stringify(sample), "utf8");

    const { output } = await handleEnrich({
      in: tmpEvent,
      rules: rulesFile,
      flags: {},
    });
    const composed = (output as any).composed || [];
    expect(Array.isArray(composed)).toBe(true);
    const keys = composed.map((c: any) => c.key);
    expect(keys).toContain("conflict_in_pr_with_low_priority_label");
    const item = composed.find(
      (c: any) => c.key === "conflict_in_pr_with_low_priority_label",
    );
    expect(item.targets).toContain("developer-agent");
    expect(item.labels).toContain("priority:low");
    expect(item.payload?.pr_number).toBe(sample.pull_request.number);
    expect(
      typeof item.reason === "string" || item.reason === undefined,
    ).toBeTruthy();
  });
});
