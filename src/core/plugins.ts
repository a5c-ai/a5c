import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";

export type ListPluginsOptions = {
  cwd?: string;
  /** bypass env gate for tests */
  force?: boolean;
};

/**
 * Discover configured plugins without executing them.
 * Sources (highest precedence first):
 * - .eventsrc.json
 * - .eventsrc.yaml
 * - .eventsrc.yml
 * - package.json -> events.plugins
 *
 * Gated by env EVENTS_ENABLE_PLUGINS (off by default). `force` bypasses.
 *
 * Resolution:
 * - Relative specifiers starting with '.' or '/' are resolved to absolute file:// URLs.
 * - Bare specifiers are returned unchanged.
 *
 * De-duplication:
 * - Merge across sources; keep first occurrence (from higher precedence).
 */
export function listPlugins(opts: ListPluginsOptions = {}): string[] {
  const cwd = path.resolve(opts.cwd || process.cwd());
  const enabled =
    (process.env.EVENTS_ENABLE_PLUGINS || "").toLowerCase() === "true";
  if (!enabled && !opts.force) return [];

  const orderedSources: Array<{
    kind: "json" | "yaml" | "yml" | "pkg";
    file: string;
  }> = [
    { kind: "json", file: path.join(cwd, ".eventsrc.json") },
    { kind: "yaml", file: path.join(cwd, ".eventsrc.yaml") },
    { kind: "yml", file: path.join(cwd, ".eventsrc.yml") },
    { kind: "pkg", file: path.join(cwd, "package.json") },
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const src of orderedSources) {
    try {
      if (!fs.existsSync(src.file)) continue;
      let list: unknown;
      if (src.kind === "pkg") {
        const raw = fs.readFileSync(src.file, "utf8");
        const pkg = JSON.parse(raw) as any;
        list = pkg?.events?.plugins;
      } else if (src.kind === "json") {
        const raw = fs.readFileSync(src.file, "utf8");
        const obj = JSON.parse(raw) as any;
        list = obj?.plugins;
      } else {
        const raw = fs.readFileSync(src.file, "utf8");
        const obj = YAML.parse(raw) as any;
        list = obj?.plugins;
      }
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (typeof item !== "string" || !item.trim()) continue;
        const resolved = resolveSpecifier(cwd, item.trim());
        if (seen.has(resolved)) continue;
        seen.add(resolved);
        result.push(resolved);
      }
    } catch {
      // best-effort: ignore parse errors per spec stub
      continue;
    }
  }

  return result;
}

function resolveSpecifier(cwd: string, spec: string): string {
  // treat paths starting with '.' or '/' as file paths; otherwise leave as bare specifier
  if (spec.startsWith(".") || spec.startsWith("/")) {
    const abs = path.resolve(cwd, spec);
    return pathToFileURL(abs).toString();
  }
  // already a file URL
  if (spec.startsWith("file://")) return spec;
  return spec;
}

export default listPlugins;
