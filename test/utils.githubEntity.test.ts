import { describe, it, expect } from "vitest";
import {
  parseGithubEntity,
  parseGithubOwnerRepo,
} from "../src/utils/githubEntity.js";

describe("utils/githubEntity", () => {
  it("parses issue web URLs", () => {
    const p = parseGithubEntity("https://github.com/owner/repo/issues/123");
    expect(p?.owner).toBe("owner");
    expect(p?.repo).toBe("repo");
    expect(p?.number).toBe(123);
  });

  it("parses issue API URLs", () => {
    const p = parseGithubEntity(
      "https://api.github.com/repos/owner/repo/issues/456",
    );
    expect(p?.owner).toBe("owner");
    expect(p?.repo).toBe("repo");
    expect(p?.number).toBe(456);
  });

  it("parses pull request web URLs", () => {
    const p = parseGithubEntity("https://github.com/o/r/pull/789");
    expect(p?.owner).toBe("o");
    expect(p?.repo).toBe("r");
    expect(p?.number).toBe(789);
  });

  it("parses pull request API URLs", () => {
    const p = parseGithubEntity("https://api.github.com/repos/o/r/pulls/42");
    expect(p?.owner).toBe("o");
    expect(p?.repo).toBe("r");
    expect(p?.number).toBe(42);
  });

  it("returns null for invalid inputs", () => {
    expect(parseGithubEntity("")).toBeNull();
    expect(parseGithubEntity("not a url")).toBeNull();
    expect(parseGithubEntity("https://github.com/o/r")).toBeNull();
  });

  it("parses owner/repo from web repo URL", () => {
    const p = parseGithubOwnerRepo("https://github.com/owner/repo");
    expect(p).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses owner/repo from API repo URL", () => {
    const p = parseGithubOwnerRepo("https://api.github.com/repos/owner/repo");
    expect(p).toEqual({ owner: "owner", repo: "repo" });
  });
});
