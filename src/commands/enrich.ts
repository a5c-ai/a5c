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
  const res = await handleEnrich(opts as any);
  if (res.code !== 0) {
    // Map structured error to CLI errorMessage when available
    const em = (res.output as any)?.error
      ? String((res.output as any).error)
      : undefined;
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
