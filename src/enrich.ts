import type { NormalizedEvent } from "./types.js";
import { readJSONFile } from "./config.js";
import { cmdEnrich } from "./commands/enrich.js";

// Backwards-compatible API used by tests and Node consumers
export async function handleEnrich(opts: {
  in?: string;
  labels?: readonly string[];
  rules?: string;
  flags?: Record<string, string | boolean | number>;
  octokit?: any;
}): Promise<{ code: number; output: NormalizedEvent }> {
  const res = await cmdEnrich({
    in: opts.in,
    labels: opts.labels ? [...opts.labels] : [],
    rules: opts.rules,
    flags: opts.flags || {},
    octokit: opts.octokit,
  });
  if (res.output) return { code: res.code, output: res.output };
  const fallback: NormalizedEvent = {
    id: "temp-" + Math.random().toString(36).slice(2),
    provider: "github",
    type: "unknown",
    occurred_at: new Date().toISOString(),
    payload: readJSONFile<any>(opts.in) || {},
    labels: opts.labels ? [...opts.labels] : [],
    provenance: { source: "cli" },
    enriched: { metadata: { error: res.errorMessage || "enrich failed" } },
  } as any;
  return { code: res.code || 1, output: fallback };
}
