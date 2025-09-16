import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { handleEnrich } from "../src/enrich.js";

function withIssue(body: any, patch: (issue: any) => void) {
  const clone = JSON.parse(JSON.stringify(body));
  patch(clone.issue);
  const tmp = path.join(process.cwd(), ".a5c-tmp", `issue-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(clone));
  return tmp;
}

describe("handleEnrich - GitHub issues mentions", () => {
  it("extracts mentions from issue title and body without duplicates", async () => {
    const base = JSON.parse(
      fs.readFileSync("tests/fixtures/github/issues.opened.json", "utf8"),
    );
    const file = withIssue(base, (issue) => {
      issue.title = "Ping @developer-agent and others";
      issue.body = "Body mentions @developer-agent and @validator-agent";
    });

    const { output } = await handleEnrich({ in: file, labels: [], flags: {} });
    const mentions = ((output.enriched as any)?.mentions || []) as any[];
    const bySource = (src: string) =>
      mentions.filter((m) => m.source === src).map((m) => m.normalized_target);

    expect(bySource("issue_title")).toContain("developer-agent");
    expect(bySource("issue_body")).toEqual(
      expect.arrayContaining(["developer-agent", "validator-agent"]),
    );

    // No duplicates for the same target across sources after overall dedupe
    const uniq = new Set(
      mentions.map((m) => `${m.source}|${m.normalized_target}`),
    );
    expect(uniq.size).toBe(mentions.length);
  });
});
