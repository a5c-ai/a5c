import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";

describe("offline GitHub enrichment contract", () => {
  it("without --use-github, returns stub with reason=flag:not_set", async () => {
    const res = await handleEnrich({
      in: "samples/pull_request.synchronize.json",
      labels: [],
      rules: undefined,
      flags: {},
    });
    expect(res.code).toBe(0);
    const gh = (res.output as any)?.enriched?.github;
    expect(gh).toBeTruthy();
    expect(gh.provider).toBe("github");
    expect(gh.partial).toBe(true);
    // Offline mode contract: no network calls; stub reason is standardized as 'flag:not_set'
    expect(gh.reason).toBe("flag:not_set");
  });
});
