import type { NormalizedEvent } from "../types.js";
import { readJSONFile } from "../config.js";
import { mapToNE } from "../providers/github/map.js";

// Programmatic API used by src/normalize.ts compatibility re-export
export async function runNormalize(opts: {
  in?: string;
  source?: string;
  labels?: string[];
}): Promise<{ code: number; output: NormalizedEvent }> {
  if (!opts.in) {
    return {
      code: 2,
      output: {
        id: "error",
        provider: "github",
        type: "error",
        occurred_at: new Date().toISOString(),
        payload: {},
        labels: opts.labels,
        provenance: { source: opts.source },
      } as any,
    };
  }
  try {
    const payload = readJSONFile<any>(opts.in) || {};
    const output = mapToNE(payload, {
      source: opts.source,
      labels: opts.labels,
    });
    return { code: 0, output };
  } catch {
    return {
      code: 2,
      output: {
        id: "error",
        provider: "github",
        type: "error",
        occurred_at: new Date().toISOString(),
        payload: {},
        labels: opts.labels,
        provenance: { source: opts.source },
      } as any,
    };
  }
}
// Command-layer wrapper to keep CLI thin
export async function cmdNormalize(opts: {
  in?: string;
  source?: string;
  labels?: string[];
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }> {
  // Resolve input path
  let inPath = opts.in;
  if (!inPath && String(opts.source) === "actions") {
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
      source: opts.source,
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
