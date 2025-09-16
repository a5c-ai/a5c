import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { handleEnrich } from "../src/enrich.js";

function tmpJson(obj: any): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a5c-flags-"));
  const file = path.join(dir, "event.json");
  fs.writeFileSync(file, JSON.stringify(obj), "utf8");
  return file;
}

describe("mentions.scan.{commit_messages,issue_comments} flags", () => {
  it("disables commit_message scanning when set to false", async () => {
    const push = {
      ref: "refs/heads/a5c/main",
      after: "2".repeat(40),
      before: "1".repeat(40),
      repository: { full_name: "a5c-ai/events" },
      commits: [{ id: "x".repeat(40), message: "feat: call @developer-agent" }],
      head_commit: { id: "2".repeat(40), message: "feat" },
    };
    const file = tmpJson(push);
    const { output } = await handleEnrich({
      in: file,
      labels: [],
      rules: undefined,
      flags: { "mentions.scan.commit_messages": "false" },
    });
    const mentions = ((output as any)?.enriched?.mentions || []) as any[];
    const commitMentions = mentions.filter(
      (m) => m.source === "commit_message",
    );
    expect(commitMentions.length).toBe(0);
  });

  it("defaults keep commit_message scanning enabled", async () => {
    const push = {
      ref: "refs/heads/a5c/main",
      after: "2".repeat(40),
      repository: { full_name: "a5c-ai/events" },
      commits: [{ id: "x".repeat(40), message: "feat: call @developer-agent" }],
    };
    const file = tmpJson(push);
    const { output } = await handleEnrich({
      in: file,
      labels: [],
      rules: undefined,
      flags: {},
    });
    const mentions = ((output as any)?.enriched?.mentions || []) as any[];
    const commitMentions = mentions.filter(
      (m) => m.source === "commit_message",
    );
    expect(commitMentions.length).toBeGreaterThan(0);
  });

  it("disables issue_comment scanning when set to false", async () => {
    const issueComment = JSON.parse(
      fs.readFileSync("samples/issue_comment.created.json", "utf8"),
    );
    const file = tmpJson(issueComment);
    const { output } = await handleEnrich({
      in: file,
      labels: [],
      rules: undefined,
      flags: { "mentions.scan.issue_comments": "false" },
    });
    const mentions = ((output as any)?.enriched?.mentions || []) as any[];
    const icMentions = mentions.filter((m) => m.source === "issue_comment");
    expect(icMentions.length).toBe(0);
  });
});
