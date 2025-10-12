import { describe, it, expect } from "vitest";
import { resolveInstallUri } from "../src/commands/install.js";

// 4-space indent
describe("resolveInstallUri", () => {
  it("passes through fully qualified URIs", () => {
    const input = "github://a5c-ai/a5c/branch/main/registry/packages/github-starter";
    expect(resolveInstallUri(input)).toBe(input);
  });

  it("strips trailing slashes for fully qualified URIs", () => {
    const input = "github://a5c-ai/a5c/branch/main/registry/packages/github-starter/";
    expect(resolveInstallUri(input)).toBe(
      "github://a5c-ai/a5c/branch/main/registry/packages/github-starter",
    );
  });

  it("converts simple package names to default registry URIs", () => {
    expect(resolveInstallUri("frontend-development")).toBe(
      "github://a5c-ai/a5c/branch/main/registry/packages/frontend-development",
    );
  });

  it("handles nested segments", () => {
    expect(resolveInstallUri("github-starter/addons")).toBe(
      "github://a5c-ai/a5c/branch/main/registry/packages/github-starter/addons",
    );
  });

  it("strips registry/packages prefix", () => {
    expect(resolveInstallUri("registry/packages/basic")).toBe(
      "github://a5c-ai/a5c/branch/main/registry/packages/basic",
    );
    expect(resolveInstallUri("packages/basic")).toBe(
      "github://a5c-ai/a5c/branch/main/registry/packages/basic",
    );
  });

  it("rejects empty identifiers", () => {
    expect(() => resolveInstallUri("")).toThrowError("install: empty package identifier");
    expect(() => resolveInstallUri("   ")).toThrowError("install: empty package identifier");
  });

  it("rejects paths containing dot segments", () => {
    expect(() => resolveInstallUri("../basic")).toThrowError("invalid package identifier");
    expect(() => resolveInstallUri("packages/../basic")).toThrowError(
      "invalid package identifier",
    );
  });
});

