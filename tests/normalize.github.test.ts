import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { handleNormalize } from "../src/normalize.js";

const fx = (name: string) =>
  JSON.parse(fs.readFileSync(path.join("tests/fixtures/github", name), "utf8"));

describe("GitHub normalization", () => {
  it("workflow_run -> NE fields", async () => {
    const input = fx("workflow_run.completed.json");
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "events-test-"));
    const tmp = path.join(tmpdir, "wr.json");
    fs.writeFileSync(tmp, JSON.stringify(input));
    const res = await handleNormalize({
      in: tmp,
      source: "cli",
      labels: ["env=test"],
    });
    const ev = res.output;
    expect(ev.type).toBe("workflow_run");
    expect(ev.provider).toBe("github");
    expect(ev.repo?.full_name).toBe("a5c-ai/events");
    expect(ev.ref?.name).toBe("a5c/main");
    expect(ev.provenance?.workflow?.name).toBe("Build");
  });

  it("pull_request -> NE fields", async () => {
    const input = fx("pull_request.synchronize.json");
    const tmp = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "events-test-")),
      "pr.json",
    );
    fs.writeFileSync(tmp, JSON.stringify(input));
    const { output: ev } = await handleNormalize({
      in: tmp,
      source: "webhook",
      labels: [],
    });
    expect(ev.type).toBe("pull_request");
    expect(ev.repo?.full_name).toBe("a5c-ai/events");
    // NE schema enumerates ref.type including 'pr' for pull requests
    expect(ev.ref?.type).toBe("pr");
    expect(ev.ref?.head).toBe("feat/samples-fixtures-issue48");
    expect(ev.ref?.base).toBe("a5c/main");
    expect(ev.actor?.login).toBe("tmuskal");
  });

  it("push -> NE fields", async () => {
    const input = fx("push.json");
    const tmp = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "events-test-")),
      "push.json",
    );
    fs.writeFileSync(tmp, JSON.stringify(input));
    const { output: ev } = await handleNormalize({
      in: tmp,
      source: "webhook",
      labels: ["x=y"],
    });
    expect(ev.type).toBe("push");
    expect(ev.ref?.name).toBe("a5c/main");
    expect(ev.ref?.sha).toBe(input.after);
    expect(ev.repo?.full_name).toBe("a5c-ai/events");
  });

  it("issue_comment -> NE fields", async () => {
    const input = fx("issue_comment.created.json");
    const tmp = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "events-test-")),
      "ic.json",
    );
    fs.writeFileSync(tmp, JSON.stringify(input));
    const { output: ev } = await handleNormalize({
      in: tmp,
      source: "webhook",
    });
    expect(ev.type).toBe("issue_comment");
    expect(ev.repo?.full_name).toBe("a5c-ai/events");
    expect(ev.actor?.login).toBe("tmuskal");
    expect(typeof ev.id).toBe("string");
  });

  it("issues.opened -> type is issue (singular)", async () => {
    const input = fx("issues.opened.json");
    const tmp = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "events-test-")),
      "issue.json",
    );
    fs.writeFileSync(tmp, JSON.stringify(input));
    const { output: ev } = await handleNormalize({
      in: tmp,
      source: "webhook",
    });
    expect(ev.type).toBe("issue");
    expect(ev.repo?.full_name).toBe("a5c-ai/events");
    expect(typeof ev.id).toBe("string");
  });
});
