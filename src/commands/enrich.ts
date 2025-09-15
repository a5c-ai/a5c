//
import type { NormalizedEvent, Mention } from "../types.js";
import { readJSONFile, loadConfig } from "../config.js";
import { extractMentions } from "../extractor.js";
import { loadRules, evaluateRulesDetailed } from "../rules.js";
import { mapToNE } from "../providers/github/map.js";
import {
  scanPatchForCodeCommentMentions,
  isBinaryPatch,
} from "../codeComments.js";
import {
  scanMentionsInCodeComments,
  detectLang as detectLangRich,
} from "../utils/commentScanner.js";

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
  // Defaults
  const includePatch = toBool(opts.flags?.include_patch ?? false);
  const commitLimit = toInt(opts.flags?.commit_limit, 50);
  const fileLimit = toInt(opts.flags?.file_limit, 200);
  // Code-comment scanning flags
  const scanChanged = toBool(
    (opts.flags as any)?.["mentions.scan.changed_files"] ?? true,
  );
  const maxFileBytes = toInt(
    (opts.flags as any)?.["mentions.max_file_bytes"],
    200 * 1024,
  );
  const languagesRaw = (opts.flags as any)?.["mentions.languages"];
  const languageFilters: string[] | undefined = Array.isArray(languagesRaw)
    ? languagesRaw
    : typeof languagesRaw === "string" && languagesRaw.length
      ? String(languagesRaw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

  const cfg = loadConfig();
  const token = cfg.githubToken;
  const isNE =
    input &&
    typeof input === "object" &&
    (input as any).provider === "github" &&
    "payload" in (input as any);
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
          includePatch,
        })
      : {
          _enrichment: {
            provider: "github",
            partial: true,
            reason: "flag:not_set",
          },
        };
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
    } else {
      // Ensure a defined patch key when include_patch=true so callers can rely on presence
      if (githubEnrichment.pr?.files) {
        githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) =>
          Object.prototype.hasOwnProperty.call(f, "patch")
            ? f
            : { ...f, patch: "" },
        );
      }
      if (githubEnrichment.push?.files) {
        githubEnrichment.push.files = githubEnrichment.push.files.map(
          (f: any) =>
            Object.prototype.hasOwnProperty.call(f, "patch")
              ? f
              : { ...f, patch: "" },
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

  // Code-comment mentions wiring
  try {
    if (scanChanged) {
      const files: any[] =
        (githubEnrichment?.pr?.files as any[]) ||
        (githubEnrichment?.push?.files as any[]) ||
        [];
      const useGithub = toBool((opts.flags as any)?.use_github);

      // Prefer patch-based scanning when include_patch=true and patches present
      const hasPatch =
        includePatch &&
        Array.isArray(files) &&
        files.some((f: any) => typeof f?.patch === "string" && f.patch.length);
      if (hasPatch) {
        for (const f of files) {
          const filename = f?.filename;
          const patch = f?.patch as string | undefined;
          if (!filename || isBinaryPatch(patch)) continue;
          if (languageFilters && languageFilters.length) {
            const lang = detectLangRich(filename);
            if (!lang || !languageFilters.includes(lang)) continue;
          }
          const found = scanPatchForCodeCommentMentions(filename, patch!, {
            window: 30,
          });
          if (found.length) {
            for (const m of found) normalizeLocationObject(m);
            mentions.push(...found);
          }
        }
      } else if (useGithub) {
        // Otherwise, when GitHub API is available, fetch file contents and scan
        try {
          let owner: string | undefined = (githubEnrichment as any)?.owner;
          let repo: string | undefined = (githubEnrichment as any)?.repo;
          if (!owner || !repo) {
            const full = (baseEvent as any)?.repository?.full_name;
            if (typeof full === "string" && full.includes("/")) {
              const parts = full.split("/");
              owner = parts[0];
              repo = parts[1];
            }
          }
          // Determine ref
          let ref: string | undefined =
            (baseEvent as any)?.pull_request?.head?.sha ||
            (baseEvent as any)?.after ||
            (baseEvent as any)?.head_commit?.id;
          const mod: any = await import("../enrichGithubEvent.js");
          const octokit =
            opts.octokit || (token ? mod.createOctokit?.(token) : undefined);
          let filesList: any[] | undefined = files;
          if ((!filesList || !filesList.length) && octokit && owner && repo) {
            if ((baseEvent as any)?.pull_request?.number) {
              const number = (baseEvent as any).pull_request.number;
              filesList = await octokit.paginate(octokit.pulls.listFiles, {
                owner,
                repo,
                pull_number: number,
                per_page: 100,
              });
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
              filesList = (comp?.data?.files as any[]) || [];
              ref = (baseEvent as any).after;
            }
          }
          if (
            octokit &&
            owner &&
            repo &&
            ref &&
            Array.isArray(filesList) &&
            filesList.length
          ) {
            for (const f of filesList) {
              const filename = f?.filename;
              if (!filename) continue;
              const lang = detectLangRich(filename);
              if (!lang) continue;
              if (
                languageFilters &&
                languageFilters.length &&
                !languageFilters.includes(lang)
              )
                continue;
              try {
                const res = await octokit.repos.getContent({
                  owner,
                  repo,
                  path: filename,
                  ref,
                });
                if (Array.isArray(res.data)) continue;
                const size = res.data.size ?? 0;
                if (maxFileBytes > 0 && size > maxFileBytes) continue;
                const encoding = res.data.encoding || "base64";
                const content: string = Buffer.from(
                  res.data.content || "",
                  encoding,
                ).toString("utf8");
                const found = scanMentionsInCodeComments({
                  content,
                  filename,
                  maxBytes: maxFileBytes,
                  languageFilters,
                  source: "code_comment",
                });
                if (found.length) mentions.push(...found);
              } catch {
                // ignore per-file errors
              }
            }
          }
        } catch {
          // best-effort: ignore failures
        }
      }
    }
  } catch {
    // swallow scanning errors; enrichment should not fail due to scanning
  }
  //

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
      ...(mentions.length
        ? { mentions: dedupeMentionsWithLocation(mentions) }
        : {}),
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

// Normalize legacy string location ("path:line") to object form { file, line }
function normalizeLocationObject(m: Mention): void {
  const loc = (m as any).location;
  if (loc && typeof loc === "string") {
    const s = String(loc);
    const idx = s.lastIndexOf(":");
    if (idx > 0) {
      const file = s.slice(0, idx);
      const lineNum = Number.parseInt(s.slice(idx + 1), 10);
      (m as any).location = {
        file,
        ...(Number.isFinite(lineNum) ? { line: lineNum } : {}),
      };
    } else {
      (m as any).location = { file: s };
    }
  }
}

function dedupeMentionsWithLocation(items: Mention[]): Mention[] {
  const seen = new Set<string>();
  const out: Mention[] = [];
  for (const m of items) {
    const loc = (m as any).location;
    let file = "";
    let line: number | string | undefined;
    if (loc && typeof loc === "object") {
      file = (loc as any).file || "";
      line = (loc as any).line;
    } else if (typeof loc === "string") {
      const idx = loc.lastIndexOf(":");
      file = idx > 0 ? loc.slice(0, idx) : loc;
      line = idx > 0 ? loc.slice(idx + 1) : undefined;
    }
    const key = `${m.source}|${m.normalized_target}|${file}:${line ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}
