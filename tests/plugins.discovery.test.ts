import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { listPlugins } from "../src/core/plugins.js";

function tmpdir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "events-plugins-"));
}

function write(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe("plugin discovery", () => {
  const OLD_ENV = { ...process.env };
  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.EVENTS_ENABLE_PLUGINS;
  });
  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it("is gated by EVENTS_ENABLE_PLUGINS (off by default)", () => {
    const dir = tmpdir();
    try {
      write(
        path.join(dir, ".eventsrc.json"),
        JSON.stringify({ plugins: ["x"] }),
      );
      const res = listPlugins({ cwd: dir });
      expect(res).toEqual([]);
    } finally {
      cleanup(dir);
    }
  });

  it("force bypasses the env gate", () => {
    const dir = tmpdir();
    try {
      write(
        path.join(dir, ".eventsrc.json"),
        JSON.stringify({ plugins: ["x"] }),
      );
      const res = listPlugins({ cwd: dir, force: true });
      expect(res).toEqual(["x"]);
    } finally {
      cleanup(dir);
    }
  });

  it("reads precedence: .json > .yaml > .yml > package.json", () => {
    const dir = tmpdir();
    process.env.EVENTS_ENABLE_PLUGINS = "true";
    try {
      // lower precedence sources
      write(
        path.join(dir, "package.json"),
        JSON.stringify({ name: "t", events: { plugins: ["pkg", "./p.cjs"] } }),
      );
      write(path.join(dir, ".eventsrc.yml"), 'plugins: ["yml", "./yml.cjs"]\n');
      write(
        path.join(dir, ".eventsrc.yaml"),
        'plugins: ["yaml", "./yaml.cjs"]\n',
      );
      // highest precedence
      write(
        path.join(dir, ".eventsrc.json"),
        JSON.stringify({ plugins: ["json", "./json.cjs", "pkg"] }),
      );

      const res = listPlugins({ cwd: dir });
      // duplicates removed, first occurrence kept; relative paths resolved
      const jsonAbs = pathToFileURL(path.resolve(dir, "./json.cjs")).toString();
      const yamlAbs = pathToFileURL(path.resolve(dir, "./yaml.cjs")).toString();
      const ymlAbs = pathToFileURL(path.resolve(dir, "./yml.cjs")).toString();
      const pAbs = pathToFileURL(path.resolve(dir, "./p.cjs")).toString();
      expect(res).toEqual([
        "json",
        jsonAbs,
        "pkg",
        "yaml",
        yamlAbs,
        "yml",
        ymlAbs,
        pAbs,
      ]);
    } finally {
      cleanup(dir);
    }
  });

  it("supports YAML and JSON formats", () => {
    const dir = tmpdir();
    process.env.EVENTS_ENABLE_PLUGINS = "true";
    try {
      write(path.join(dir, ".eventsrc.yaml"), 'plugins: ["a", "b"]\n');
      write(
        path.join(dir, ".eventsrc.json"),
        JSON.stringify({ plugins: ["c"] }),
      );
      const res = listPlugins({ cwd: dir });
      expect(res).toContain("c");
      expect(res).toContain("a");
      expect(res).toContain("b");
    } finally {
      cleanup(dir);
    }
  });

  it("resolves relative paths to absolute file:// URLs; leaves bare as-is", () => {
    const dir = tmpdir();
    process.env.EVENTS_ENABLE_PLUGINS = "true";
    try {
      write(
        path.join(dir, ".eventsrc.json"),
        JSON.stringify({
          plugins: [
            "@org/plugin",
            "./rel.cjs",
            "/abs.cjs",
            "file:///already.cjs",
          ],
        }),
      );
      const res = listPlugins({ cwd: dir });
      expect(res[0]).toBe("@org/plugin");
      expect(res[1]).toMatch(/^file:\/\//);
      expect(res[2]).toMatch(/^file:\/\//);
      expect(res[3]).toBe("file:///already.cjs");
    } finally {
      cleanup(dir);
    }
  });
});
