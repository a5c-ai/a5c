import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";

const issuePayload = {
  action: "opened",
  issue: {
    id: 1,
    number: 123,
    title: "Fix bug for @developer-agent and @octocat",
    body: "Hey @validator-agent, please review this. cc @team-alpha",
  },
  repository: {
    id: 1055826069,
    name: "events",
    full_name: "a5c-ai/events",
    private: true,
  },
  sender: { id: 221166651, login: "a5c-ai[bot]", type: "Bot" },
};

describe("mentions extractor - issue title/body", () => {
  it("extracts mentions from issues title and body", async () => {
    const { code, output } = await handleEnrich({
      in: createTmp(issuePayload),
    });
    expect(code).toBe(0);
    const mentions = (output.enriched as any)?.mentions || [];
    expect(Array.isArray(mentions)).toBe(true);
    const sources = mentions.map((m: any) => m.source);
    expect(sources).toContain("issue_title");
    expect(sources).toContain("issue_body");
    const targets = mentions.map((m: any) => m.normalized_target);
    expect(targets).toContain("developer-agent");
    expect(targets).toContain("validator-agent");
  });
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function createTmp(obj: any): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "events-issue-"));
  const fp = path.join(dir, "issue.json");
  fs.writeFileSync(fp, JSON.stringify(obj));
  return fp;
}
