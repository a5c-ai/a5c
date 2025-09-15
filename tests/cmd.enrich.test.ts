// Reset the file to the intended content (previous edit introduced duplicates)
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Helper to create temp JSON file
function writeTempJson(obj: any): string {
  const fp = path.join(
    process.cwd(),
    "tmp-enrich-" + Math.random().toString(36).slice(2) + ".json",
  );
  fs.writeFileSync(fp, JSON.stringify(obj), "utf8");
  return fp;
}

describe("cmdEnrich (unit)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns code 2 when --in is missing", async () => {
    const { cmdEnrich } = await import("../src/commands/enrich.ts");
    const res = await cmdEnrich({} as any);
    expect(res.code).toBe(2);
    expect(res.errorMessage).toMatch(/Missing required --in/);
  });

  it("skips GitHub enrichment by default and returns enriched shell", async () => {
    const ne = {
      provider: "github",
      payload: { pull_request: { title: "T", body: "B" } },
    };
    const fp = writeTempJson(ne);
    const { cmdEnrich } = await import("../src/commands/enrich.ts");
    const res = await cmdEnrich({ in: fp, flags: {} });
    expect(res.code).toBe(0);
    expect(res.output?.enriched?.github).toBeTruthy();
    // When skipped, provider metadata is present
    // @ts-expect-error - loose type
    expect(
      res.output!.enriched!.github!.provider ||
        res.output!.enriched!.github!.skipped,
    ).toBeTruthy();
    // Derived/metadata objects exist
    expect(res.output?.enriched?.metadata).toBeTruthy();
    expect(res.output?.enriched?.derived).toBeTruthy();
  });

  it("removes patch fields when include_patch is false (default)", async () => {
    // Mock enrichGithubEvent to return files with patch
    const mocked = {
      _enrichment: {
        provider: "github",
        pr: {
          files: [
            { filename: "a.txt", status: "modified", patch: "@@ -1 +1 @@" },
            { filename: "b.txt", status: "added", patch: "+hello" },
          ],
        },
      },
    };
    vi.doMock(
      path.resolve(process.cwd(), "src/enrichGithubEvent.js"),
      () => ({
        enrichGithubEvent: async () => mocked,
        default: async () => mocked,
      }),
      { virtual: false },
    );

    const ne = { provider: "github", payload: {} };
    const fp = writeTempJson(ne);
    const { cmdEnrich } = await import("../src/commands/enrich.ts");
    const res = await cmdEnrich({ in: fp, flags: { use_github: true } });
    expect(res.code).toBe(0);
    const files = (res.output as any)?.enriched?.github?.pr?.files || [];
    expect(files.length).toBe(2);
    expect(files.every((f: any) => f.patch === undefined)).toBe(true);
  });

  it("keeps patch fields when include_patch is true", async () => {
    const mocked = {
      _enrichment: {
        provider: "github",
        pr: {
          files: [
            { filename: "c.txt", status: "modified", patch: "@@ -1 +1 @@" },
          ],
        },
      },
    };
    vi.doMock(
      path.resolve(process.cwd(), "src/enrichGithubEvent.js"),
      () => ({
        enrichGithubEvent: async () => mocked,
        default: async () => mocked,
      }),
      { virtual: false },
    );

    const ne = { provider: "github", payload: {} };
    const fp = writeTempJson(ne);
    const { cmdEnrich } = await import("../src/commands/enrich.ts");
    const res = await cmdEnrich({
      in: fp,
      flags: { use_github: true, include_patch: true },
    });
    expect(res.code).toBe(0);
    const files = (res.output as any)?.enriched?.github?.pr?.files || [];
    expect(files.length).toBe(1);
    expect(files[0].patch).toBeTypeOf("string");
  });
});
