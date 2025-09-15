import { describe, it, expect } from "vitest";
import { handleNormalize } from "../src/normalize.js";

describe("normalize → NE schema shape (smoke)", () => {
  it("workflow_run sample produces required fields", async () => {
    const { output } = await handleNormalize({
      in: "samples/workflow_run.completed.json",
      source: "cli",
      labels: ["test"],
    });
    expect(output.provider).toBe("github");
    expect(output.type).toBe("workflow_run");
    expect(typeof output.id).toBe("string");
    expect(typeof output.occurred_at).toBe("string");
    expect(output.repo?.full_name).toContain("a5c-ai/");
    expect(output.actor?.login).toBeTruthy();
    expect(Array.isArray(output.labels)).toBe(true);
    expect(output.provenance?.source).toBe("cli");
    // Optional workflow provenance when workflow_run is present
    const wf: any = (output as any).provenance?.workflow;
    expect(wf?.name).toBe("Build");
    expect(String(wf?.run_id || "")).toBeTruthy();
  });

  it("pull_request sample sets ref base/head and labels preserved", async () => {
    const { output } = await handleNormalize({
      in: "samples/pull_request.synchronize.json",
      source: "cli",
      labels: ["foo=bar"],
    });
    expect(output.type).toBe("pull_request");
    expect(output.ref?.base).toBeTruthy();
    expect(output.ref?.head).toBeTruthy();
    expect(output.labels?.includes("foo=bar")).toBe(true);
  });

  it("push sample sets branch ref and sha", async () => {
    const { output } = await handleNormalize({
      in: "samples/push.json",
      source: "cli",
    });
    expect(output.type).toBe("push");
    expect(output.ref?.type).toBe("branch");
    expect(output.ref?.sha).toBeTruthy();
  });

  it("issue_comment sample sets type and actor", async () => {
    const { output } = await handleNormalize({
      in: "samples/issue_comment.created.json",
      source: "cli",
    });
    expect(output.type).toBe("issue_comment");
    expect(output.actor?.login).toBeTruthy();
  });
});
