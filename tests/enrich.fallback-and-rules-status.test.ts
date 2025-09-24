import { describe, it, expect, vi } from "vitest";

// Simulate failure in enrichGithubEvent to verify fallback of PR fields
vi.mock("../src/enrichGithubEvent.js", () => ({
  enrichGithubEvent: async () => {
    throw new Error("simulated enrich failure");
  },
}));

import { handleEnrich } from "../src/enrich.js";
import fs from "node:fs";

describe("enrich fallbacks and rules status metadata", () => {
  it("fallbacks PR fields (number,draft,mergeable_state) when enrichment is partial", async () => {
    const payload: any = {
      repository: { full_name: "a5c-ai/a5c" },
      pull_request: {
        id: 123456,
        number: 42,
        draft: true,
        mergeable_state: "blocked",
        updated_at: "2024-05-01T00:00:00Z",
        head: { sha: "deadbeef" },
      },
    };
    const tmpIn = "tmp.pr.enrich-fallback.json";
    fs.writeFileSync(tmpIn, JSON.stringify(payload));

    // Pass a dummy octokit so that enrich() error path returns partial enrichment instead of exiting with code 3
    const dummyOctokit: any = {
      pulls: {},
      repos: {},
      paginate: async () => [],
    };
    const { code, output } = await handleEnrich({
      in: tmpIn,
      flags: { use_github: true },
      octokit: dummyOctokit,
    });
    expect(code).toBe(0);
    const gh: any = (output as any).enriched?.github || {};
    expect(gh.partial).toBe(true);
    // Fallbacks from payload should be projected onto enriched.github.pr
    expect(gh.pr?.number).toBe(42);
    expect(gh.pr?.draft).toBe(true);
    expect(gh.pr?.mergeable_state).toBe("blocked");
  });

  it("attaches rules_status.ok=true when rules file loads and evaluates", async () => {
    const sample = JSON.parse(
      fs.readFileSync("samples/pull_request.synchronize.json", "utf8"),
    );
    // Ensure payload has expected fields for conditions
    sample.pull_request = sample.pull_request || {};
    sample.pull_request.mergeable_state = "dirty";
    sample.pull_request.labels = [{ name: "priority:low" }];
    const tmpIn = "tmp.pr.rules.ok.json";
    fs.writeFileSync(tmpIn, JSON.stringify(sample));

    const rules = [
      {
        key: "compose:on:dirty+low",
        on: "pull_request",
        when: {
          all: [
            { path: "$.payload.pull_request.mergeable_state", eq: "dirty" },
            {
              path: "$.payload.pull_request.labels[*].name",
              contains: "priority:low",
            },
          ],
        },
      },
    ];
    const tmpRules = "tmp.rules.ok.json";
    fs.writeFileSync(tmpRules, JSON.stringify(rules));

    const { output } = await handleEnrich({
      in: tmpIn,
      rules: tmpRules,
      flags: {},
    });
    const meta: any = (output as any).enriched?.metadata || {};
    expect(meta.rules).toBe(tmpRules);
    expect(meta.rules_status?.ok).toBe(true);
    // composed should be emitted as well
    const composed = (output as any).composed || [];
    expect(Array.isArray(composed)).toBe(true);
    expect(composed.some((c: any) => c.key === "compose:on:dirty+low")).toBe(
      true,
    );
  });

  it("attaches rules_status.ok=false with warnings when rules file fails to load", async () => {
    const { output } = await handleEnrich({
      in: "samples/push.json",
      rules: "non-existent-file-941.yml",
      flags: {},
    });
    const meta: any = (output as any).enriched?.metadata || {};
    expect(meta.rules).toBe("non-existent-file-941.yml");
    expect(meta.rules_status?.ok).toBe(false);
    const warnings = meta.rules_status?.warnings || [];
    expect(Array.isArray(warnings)).toBe(true);
    expect(String(warnings[0] || "")).toMatch(/no such file|ENOENT|not find/i);
  });
});
