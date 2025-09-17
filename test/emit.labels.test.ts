import { describe, it, expect } from "vitest";
import * as mod from "../src/emit.js";

describe("emit labels", () => {
  it("parses entity url for owner/repo/number", () => {
    const fn: any = mod as any;
    const parsed = fn.parseGithubEntity(
      "https://github.com/owner/repo/issues/123",
    );
    expect(parsed?.owner).toBe("owner");
    expect(parsed?.repo).toBe("repo");
    expect(parsed?.number).toBe(123);
  });
});
