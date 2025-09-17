import type { Provider } from "../types.js";

export type ProviderName = "github";

// Adapter to existing implementation while keeping a clean interface
import { mapToNE as mapToNEImpl } from "./map.js";

export async function enrichGithub(
  payload: any,
  opts?: {
    token?: string;
    commitLimit?: number;
    fileLimit?: number;
    octokit?: any;
  },
): Promise<any> {
  const mod: any = await import("../../enrichGithubEvent.js");
  const fn = (mod.enrichGithubEvent || mod.default) as (
    e: any,
    o?: any,
  ) => Promise<any>;
  return fn(payload, opts);
}

export const githubProvider: Provider = {
  normalize: (payload, opts) => mapToNEImpl(payload, opts),
  enrich: (payload, opts) => enrichGithub(payload, opts),
};

export { mapToNEImpl as mapToNE };
