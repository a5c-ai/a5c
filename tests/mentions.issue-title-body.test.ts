import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";

const sample = {
  action: "opened",
  issue: {
    id: 1001,
    number: 572,
    title: "Ping @developer-agent to review the proposal",
    body: "Details for @validator-agent and notes for @developer-agent to address.",
  },
  repository: { full_name: "a5c-ai/events" },
};

describe("mentions extractor - GitHub Issue title/body", () => {
  it("extracts mentions from issue.title and issue.body with correct sources and dedupes duplicates", async () => {
    const tmp = "/tmp/issues.opened.sample.json";
    require("fs").writeFileSync(tmp, JSON.stringify(sample));

    const { code, output } = await handleEnrich({ in: tmp, flags: {} });
    expect(code).toBe(0);
    const mentions = (output as any)?.enriched?.mentions || [];
    expect(Array.isArray(mentions)).toBe(true);

    const titleMentions = mentions.filter(
      (m: any) => m.source === "issue_title",
    );
    const bodyMentions = mentions.filter((m: any) => m.source === "issue_body");
    expect(titleMentions.length).toBeGreaterThan(0);
    expect(bodyMentions.length).toBeGreaterThan(0);

    const targets = mentions.map((m: any) => m.normalized_target);
    expect(targets).toContain("developer-agent");
    expect(targets).toContain("validator-agent");

    // context snippets should be present
    expect(
      mentions.every(
        (m: any) => typeof m.context === "string" && m.context.length > 0,
      ),
    ).toBe(true);
  });
});
