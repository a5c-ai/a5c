import type { NormalizedEvent, Mention } from "../types.js";
import { readJSONFile, loadConfig } from "../config.js";
import { extractMentions, dedupeMentions } from "../extractor.js";
import { loadRules, evaluateRulesDetailed } from "../rules.js";
import {
  scanMentionsInCodeComments,
  detectLang,
} from "../utils/commentScanner.js";
import { isBinaryPatch } from "../codeComments.js";

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
  const baseEvent = isNE ? input.payload : input;

  const neShell: NormalizedEvent = isNE
    ? input
    : {
        id: String(
          baseEvent?.after ||
            baseEvent?.workflow_run?.id ||
            baseEvent?.pull_request?.id ||
            "temp-" + Math.random().toString(36).slice(2),
        ),
        provider: "github",
        type: baseEvent?.pull_request
          ? "pull_request"
          : baseEvent?.workflow_run
            ? "workflow_run"
            : baseEvent?.ref
              ? "push"
              : "commit",
        occurred_at: new Date(
          baseEvent?.head_commit?.timestamp ||
            baseEvent?.workflow_run?.updated_at ||
            baseEvent?.pull_request?.updated_at ||
            Date.now(),
        ).toISOString(),
        payload: baseEvent,
        labels: opts.labels || [],
        provenance: { source: "cli" },
      };

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
          includePatch,
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

  // Code comment mentions: prefer patch when include_patch=true and patches present, otherwise fetch files via GitHub
  try {
    const flags = opts.flags || {};
    const scanChanged = toBool(
      (flags as any)["mentions.scan.changed_files"] ?? true,
    );
    if (scanChanged) {
      const maxBytes = toInt(
        (flags as any)["mentions.max_file_bytes"],
        200 * 1024,
      );
      const langAllowRaw = (flags as any)["mentions.languages"];
      const languageFilters = Array.isArray(langAllowRaw)
        ? (langAllowRaw as string[])
            .map((s) => String(s).trim())
            .filter(Boolean)
        : typeof langAllowRaw === "string" && langAllowRaw.length
          ? String(langAllowRaw)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;

      const prFiles: any[] = (githubEnrichment?.pr?.files as any[]) || [];
      const pushFiles: any[] = (githubEnrichment?.push?.files as any[]) || [];
      const filesList: any[] = prFiles.length ? prFiles : pushFiles;

      const preferPatch =
        includePatch &&
        Array.isArray(filesList) &&
        filesList.some((f) => typeof f?.patch === "string" && f.patch.length);

      // Helper to check allowed languages for a filename
      const isAllowedLang = (filename: string): boolean => {
        if (!languageFilters || !languageFilters.length) return true;
        const lang = detectLang(filename);
        return !!lang && languageFilters.includes(lang);
      };

      if (preferPatch) {
        for (const f of filesList) {
          const filename = f?.filename;
          const patch = f?.patch as string | undefined;
          if (!filename || !patch) continue;
          if (isBinaryPatch(patch)) continue;
          if (!isAllowedLang(filename)) continue;
          // Approximate file content from patch to run generic comment scanner
          const lines = patch.split(/\r?\n/);
          const approxFile: string[] = [];
          for (const l of lines) {
            if (
              l.startsWith("+++") ||
              l.startsWith("---") ||
              l.startsWith("@@")
            ) {
              approxFile.push("");
              continue;
            }
            if (l.startsWith("+") || l.startsWith(" ") || l.startsWith("-"))
              approxFile.push(l.slice(1));
            else approxFile.push(l);
          }
          const content = approxFile.join("\n");
          const found = scanMentionsInCodeComments({
            content,
            filename,
            maxBytes,
            languageFilters,
            source: "code_comment",
          });
          if (found?.length) mentions.push(...found);
        }
      } else {
        // Fallback: fetch file contents via GitHub API and scan
        const useGithub = toBool((opts.flags as any)?.use_github);
        if (useGithub) {
          let owner: string | undefined = githubEnrichment?.owner;
          let repo: string | undefined = githubEnrichment?.repo;
          if (!owner || !repo) {
            const full = (baseEvent as any)?.repository?.full_name;
            if (typeof full === "string" && full.includes("/")) {
              const parts = full.split("/");
              owner = parts[0];
              repo = parts[1];
            }
          }
          const ref: string | undefined =
            (baseEvent as any)?.pull_request?.head?.sha ||
            (baseEvent as any)?.after ||
            (baseEvent as any)?.head_commit?.id;
          if (owner && repo && ref) {
            try {
              const mod: any = await import("../enrichGithubEvent.js");
              const octokit =
                opts.octokit ||
                (token ? mod.createOctokit?.(token) : undefined);
              let changed: { filename: string }[] = [];
              if (Array.isArray(filesList) && filesList.length) {
                changed = filesList.map((f: any) => ({ filename: f.filename }));
              } else if (octokit) {
                if ((baseEvent as any)?.pull_request?.number) {
                  const number = (baseEvent as any).pull_request.number;
                  const list = await octokit.paginate(octokit.pulls.listFiles, {
                    owner,
                    repo,
                    pull_number: number,
                    per_page: 100,
                  });
                  changed = Array.isArray(list)
                    ? list.map((f: any) => ({ filename: f.filename }))
                    : [];
                } else if (
                  (baseEvent as any)?.before &&
                  (baseEvent as any)?.after
                ) {
                  const comp = await octokit.repos.compareCommits({
                    owner,
                    repo,
                    base: (baseEvent as any).before,
                    head: (baseEvent as any).after,
                  });
                  const list = (comp?.data?.files as any[]) || [];
                  changed = list.map((f: any) => ({ filename: f.filename }));
                }
              }
              if (octokit && Array.isArray(changed) && changed.length) {
                for (const f of changed) {
                  const filename = f.filename;
                  if (!isAllowedLang(filename)) continue;
                  try {
                    const res = await octokit.repos.getContent({
                      owner,
                      repo,
                      path: filename,
                      ref,
                    });
                    if (Array.isArray(res.data)) continue;
                    const size = res.data.size ?? 0;
                    if (maxBytes > 0 && size > maxBytes) continue;
                    const encoding = res.data.encoding || "base64";
                    const content: string = Buffer.from(
                      res.data.content || "",
                      encoding,
                    ).toString("utf8");
                    const found = scanMentionsInCodeComments({
                      content,
                      filename,
                      maxBytes,
                      languageFilters,
                      source: "code_comment",
                    });
                    if (found?.length) mentions.push(...found);
                  } catch {}
                }
              }
            } catch {}
          }
        }
      }
    }
  } catch {}

  // Dedupe mentions across sources
  const allMentions = dedupeMentions(mentions);

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
      ...(allMentions.length ? { mentions: allMentions } : {}),
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
