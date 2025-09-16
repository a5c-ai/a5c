import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/config";

const originalEnv = { ...process.env };

describe("config token precedence", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.A5C_AGENT_GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    delete process.env.DEBUG;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("prefers A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN", () => {
    process.env.GITHUB_TOKEN = "ghp_from_github_token";
    process.env.A5C_AGENT_GITHUB_TOKEN = "ghp_from_a5c_token";
    const cfg = loadConfig();
    expect(cfg.githubToken).toBe("ghp_from_a5c_token");
  });

  it("falls back to GITHUB_TOKEN when A5C token missing", () => {
    process.env.GITHUB_TOKEN = "ghp_only_github";
    delete process.env.A5C_AGENT_GITHUB_TOKEN;
    const cfg = loadConfig();
    expect(cfg.githubToken).toBe("ghp_only_github");
  });

  it("returns undefined when no token env provided", () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.A5C_AGENT_GITHUB_TOKEN;
    const cfg = loadConfig();
    expect(cfg.githubToken).toBeUndefined();
  });

  it("parses DEBUG env to boolean", () => {
    process.env.DEBUG = "true";
    expect(loadConfig().debug).toBe(true);
    process.env.DEBUG = "FALSE";
    expect(loadConfig().debug).toBe(false);
  });
});
