import type { NormalizedEvent, Mention } from "../types.js";
import { readJSONFile, loadConfig } from "../config.js";
import { extractMentions } from "../extractor.js";
import { loadRules, evaluateRulesDetailed } from "../rules.js";
import { mapToNE } from "../providers/github/map.js";

export async function cmdEnrich(opts: {
  in?: string;
  labels?: string[];
  rules?: string;
  flags?: Record<string, string | boolean | number>;
  octokit?: any;
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }> {
  if (!opts.in) return { code: 2, errorMessage: "Missing required --in FILE" };
  let input: any;
  try {
    input = readJSONFile<any>(opts.in) || {};
  } catch (e: any) {
    const msg =
      e?.code === "ENOENT"
        ? `Input file not found: ${e?.path || opts.in}`
        : `Invalid JSON or read error: ${e?.message || e}`;
    return { code: 2, errorMessage: msg };
  }
  // Default include_patch to false to minimize payload size
  const includePatch = toBool(opts.flags?.include_patch ?? false);
  const commitLimit = toInt(opts.flags?.commit_limit, 50);
  const fileLimit = toInt(opts.flags?.file_limit, 200);

  const cfg = loadConfig();
  const token = cfg.githubToken;

  const isNE =
    input &&
    typeof input === "object" &&
    input.provider === "github" &&
    "payload" in input;
  // If input is already a NormalizedEvent, keep as-is. Otherwise, map raw payload to NE using provider mapping
  const neShell: NormalizedEvent = isNE
    ? (input as NormalizedEvent)
    : mapToNE(input, { source: "cli", labels: opts.labels });

  // Use the underlying provider payload for enrichment/mentions extraction
  const baseEvent = (neShell as any).payload || input;

  let githubEnrichment: any = {};
  try {
    const mod: any = await import("../enrichGithubEvent.js");
    const fn = (mod.enrichGithubEvent || mod.default) as (
      e: any,
      o?: any,
    ) => Promise<any>;
    // Only call provider if explicitly requested via flags.use_github truthy
    const useGithub = toBool((opts.flags as any)?.use_github);
    const enriched = useGithub
      ? await fn(baseEvent, {
          token,
          commitLimit,
          fileLimit,
          octokit: opts.octokit,
        })
      : { _enrichment: { provider: "github", skipped: true } };
    githubEnrichment = enriched?._enrichment || {};
    if (!includePatch) {
      if (githubEnrichment.pr?.files) {
        githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => ({
          ...f,
          patch: undefined,
        }));
      }
      if (githubEnrichment.push?.files) {
        githubEnrichment.push.files = githubEnrichment.push.files.map(
          (f: any) => ({ ...f, patch: undefined }),
        );
      }
    }
  } catch (e: any) {
    // If provider was requested but failed, return provider error code 3
    const useGithub = toBool((opts.flags as any)?.use_github);
    if (useGithub) {
      return {
        code: 3,
        errorMessage: `GitHub enrichment failed: ${e?.message || e}`,
      };
    }
    githubEnrichment = {
      provider: "github",
      partial: true,
      errors: [{ message: String(e?.message || e) }],
    };
  }

  const mentions: Mention[] = [];
  try {
    const pr = (baseEvent as any)?.pull_request;
    if (pr?.body) mentions.push(...extractMentions(String(pr.body), "pr_body"));
    if (pr?.title)
      mentions.push(...extractMentions(String(pr.title), "pr_title"));
    const commits = (baseEvent as any)?.commits;
    if (Array.isArray(commits)) {
      for (const c of commits)
        if (c?.message)
          mentions.push(
            ...extractMentions(String(c.message), "commit_message"),
          );
    }
    const commentBody = (baseEvent as any)?.comment?.body;
    if (commentBody)
      mentions.push(...extractMentions(String(commentBody), "issue_comment"));
  } catch {}

  const output: NormalizedEvent = {
    ...(neShell as any),
    enriched: {
      ...(neShell.enriched || {}),
      github: githubEnrichment,
      metadata: {
        ...(neShell.enriched?.metadata || {}),
        rules: opts.rules || null,
      },
      derived: {
        ...(neShell.enriched?.derived || {}),
        flags: opts.flags || {},
      },
      ...(mentions.length ? { mentions } : {}),
    },
  };
  // Evaluate composed event rules when --rules provided
  try {
    const rules = loadRules(opts.rules);
    if (rules.length) {
      const evalObj: any = {
        ...output,
        enriched: output.enriched,
        labels: output.labels || [],
      };
      const res = evaluateRulesDetailed(evalObj, rules);
      if (res?.composed?.length) {
        const composed = res.composed.map((c: any) => ({
          key: c.key,
          reason:
            Array.isArray(c.criteria) && c.criteria.length
              ? c.criteria.join(" && ")
              : undefined,
          targets: c.targets,
          labels: c.labels,
          payload: c.payload,
        }));
        (output as any).composed = composed;
      }
      const meta: any = (output.enriched as any).metadata || {};
      (output.enriched as any).metadata = { ...meta, rules_status: res.status };
    }
  } catch (e) {
    const meta: any = (output.enriched as any).metadata || {};
    (output.enriched as any).metadata = {
      ...meta,
      rules_status: { ok: false, warnings: [String((e as any)?.message || e)] },
    };
  }
  return { code: 0, output };
}

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
}

function toInt(v: any, def = 0): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}
