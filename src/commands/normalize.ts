import type { NormalizedEvent } from "../types.js";
import { readJSONFile } from "../config.js";
import { mapToNE } from "../providers/github/map.js";

// Programmatic API used by src/normalize.ts compatibility re-export
export async function runNormalize(opts: {
  in?: string;
  source?: string;
  labels?: string[];
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }> {
  const normSource = normalizeSource(opts.source);
  if (!opts.in)
    return {
      code: 2,
      errorMessage: "Missing required input path for normalization",
    };
  try {
    const payload = readJSONFile<any>(opts.in) || {};
    const output = mapToNE(payload, {
      source: normSource,
      labels: opts.labels,
    });
    return { code: 0, output };
  } catch (e: any) {
    const msg =
      e?.code === "ENOENT"
        ? `Input file not found: ${e?.path || opts.in}`
        : `Invalid JSON or read error: ${e?.message || e}`;
    return { code: 2, errorMessage: msg };
  }
}
// Command-layer wrapper to keep CLI thin

export async function cmdNormalize(opts: {
  in?: string;
  source?: string;
  labels?: string[];
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }> {
  // Normalize source alias: accept "actions" as input, persist as "action"
  // Resolve input path
  let inPath = opts.in;
  const normSource = normalizeSource(opts.source);
  // If source is GitHub Actions (alias or canonical), default to GITHUB_EVENT_PATH
  if (!inPath && normSource === "action") {
    inPath = process.env.GITHUB_EVENT_PATH;
    if (!inPath)
      return {
        code: 2,
        errorMessage: "GITHUB_EVENT_PATH is not set; provide --in FILE",
      };
  }
  if (!inPath)
    return {
      code: 2,
      errorMessage: "Missing required --in FILE (or use --source actions)",
    };

  try {
    const payload = readJSONFile<any>(inPath);
    const output = mapToNE(payload || {}, {
      source: normSource,
      labels: opts.labels,
    });
    return { code: 0, output };
  } catch (e: any) {
    const msg =
      e?.code === "ENOENT"
        ? `Input file not found: ${e?.path || inPath}`
        : `Invalid JSON or read error: ${e?.message || e}`;
    return { code: 2, errorMessage: msg };
  }
}

function normalizeSource(
  src?: string,
): "action" | "webhook" | "cli" | undefined {
  if (!src) return src as any;
  const s = String(src).toLowerCase();
  if (s === "actions" || s === "action") return "action";
  if (s === "webhook") return "webhook";
  if (s === "cli") return "cli";
  return src as any;
}
