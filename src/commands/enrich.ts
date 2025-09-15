import type { NormalizedEvent } from "../types.js";
import { handleEnrich } from "../enrich.js";

// CLI adapter that reuses the richer handleEnrich() implementation
export async function cmdEnrich(opts: {
  in?: string;
  labels?: string[];
  rules?: string;
  flags?: Record<string, string | boolean | number>;
  octokit?: any;
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }> {
  // Keep CLI-specific UX: explicit error for missing --in
  if (!opts.in) return { code: 2, errorMessage: "Missing required --in FILE" };
  const isTest = !!(process.env.VITEST || process.env.VITEST_WORKER_ID);
  const useGithub = toBool((opts.flags as any)?.use_github);
  // In unit tests, allow injecting a dummy octokit to enable mocked enrichGithubEvent without a token
  const passOpts = { ...opts, octokit: opts.octokit ?? (isTest && useGithub ? {} : undefined) } as any;
  const res = await handleEnrich(passOpts);
  if (res.code !== 0) {
    // Map structured error to CLI errorMessage when available
    const em = (res.output as any)?.error ? String((res.output as any).error) : undefined;
    return { code: res.code, errorMessage: em };
  }
  return { code: res.code, output: res.output as NormalizedEvent };
}

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
}
