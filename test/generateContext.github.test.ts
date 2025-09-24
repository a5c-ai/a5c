import { describe, it, expect } from "vitest";
import { handleGenerateContext } from "../src/generateContext.js";

const hasToken =
  !!process.env.A5C_AGENT_GITHUB_TOKEN || !!process.env.GITHUB_TOKEN;

describe("generate_context (github uri)", () => {
  it.skipIf(!hasToken)(
    "supports refs with slashes in github:// URIs",
    async () => {
      const res = await handleGenerateContext({
        in: undefined,
        template: "github://a5c-ai/a5c/a5c/main/README.md",
        vars: {},
      });
      expect(res.code).toBe(0);
      // Spot-check a stable header line in README
      expect(res.output || "").toContain("a5c SDK & CLI");
    },
  );
});
