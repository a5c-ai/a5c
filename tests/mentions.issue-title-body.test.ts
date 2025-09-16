import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { handleEnrich } from "../src/enrich.js";

describe("mentions extractor - Issue title/body", () => {
  it("extracts @mentions from issue title and body with correct sources", async () => {
    const payload = {
      action: "opened",
      issue: {
        id: 123,
        number: 572,
        title: "Follow up for @developer-agent: scan mentions in issues",
        body: "Hi team, please also include @validator-agent in review.",
      },
      repository: {
        id: 1055826069,
        name: "events",
        full_name: "a5c-ai/events",
        private: true,
      },
      sender: { id: 1, login: "user", type: "User" },
    };
    const tmp = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "events-test-")),
      "issues.opened.json",
    );
    fs.writeFileSync(tmp, JSON.stringify({ provider: "github", payload }));

    const { code, output } = await handleEnrich({ in: tmp, flags: {} });
    expect(code).toBe(0);
    const mentions = (output as any)?.enriched?.mentions || [];
    expect(Array.isArray(mentions)).toBe(true);

    const titles = mentions.filter((m: any) => m.source === "issue_title");
    const bodies = mentions.filter((m: any) => m.source === "issue_body");

    expect(titles.length).toBeGreaterThan(0);
    expect(bodies.length).toBeGreaterThan(0);

    const tTargets = titles.map((m: any) => m.normalized_target);
    const bTargets = bodies.map((m: any) => m.normalized_target);
    expect(tTargets).toContain("developer-agent");
    expect(bTargets).toContain("validator-agent");
  });
});
