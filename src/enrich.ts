import type { NormalizedEvent, Mention } from "./types.js";
import { readJSONFile, loadConfig } from "./config.js";
import { extractMentions, dedupeMentions } from "./extractor.js";
import { isBinaryPatch } from "./codeComments.js";
import { scanMentionsInCodeComments } from "./utils/commentScanner.js";
import { evaluateRulesDetailed, loadRules } from "./rules.js";

export async function handleEnrich(opts: {
  in?: string;
  labels?: string[];
  rules?: string;
  flags?: Record<string, string | boolean | number>;
  octokit?: any;
}): Promise<{
  code: number;
  output: NormalizedEvent | Record<string, unknown>;
}> {
  if (!opts.in) return { code: 2, output: { error: "enrich: missing --in" } };
  let input: any;
  try {
    input = readJSONFile<any>(opts.in) || {};
  } catch (e: any) {
    return { code: 2, output: { error: String(e?.message || e) } };
  }
  const includePatch = toBool(opts.flags?.include_patch ?? false);
  const commitLimit = toInt(opts.flags?.commit_limit, 50);
  const fileLimit = toInt(opts.flags?.file_limit, 200);
  const useGithub = toBool(opts.flags?.use_github);
  const scanChangedFilesFlag = toBool(
    (opts.flags as any)?.["mentions.scan.changed_files"] ?? true,
  );
  const scanCommitMessagesFlag = toBool(
    (opts.flags as any)?.["mentions.scan.commit_messages"] ?? true,
  );
  const scanIssueCommentsFlag = toBool(
    (opts.flags as any)?.["mentions.scan.issue_comments"] ?? true,
  );
  const maxFileBytesFlag = toInt(
    (opts.flags as any)?.["mentions.max_file_bytes"],
    200 * 1024,
  );
  const langFilterRawFlag = (opts.flags as any)?.["mentions.languages"] as any;
  const languageFiltersFlag = normalizeLanguageFilters(langFilterRawFlag);

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
            baseEvent?.issue?.id ||
            baseEvent?.comment?.id ||
            "temp-" + Math.random().toString(36).slice(2),
        ),
        provider: "github",
        type: baseEvent?.pull_request
          ? "pull_request"
          : baseEvent?.workflow_run
            ? "workflow_run"
            : baseEvent?.comment && baseEvent?.issue
              ? "issue_comment"
              : baseEvent?.issue
                ? "issues"
                : baseEvent?.client_payload
                  ? "repository_dispatch"
                  : baseEvent?.ref
                    ? "push"
                    : "commit",
        occurred_at: new Date(
          baseEvent?.head_commit?.timestamp ||
            baseEvent?.workflow_run?.updated_at ||
            baseEvent?.pull_request?.updated_at ||
            baseEvent?.comment?.updated_at ||
            baseEvent?.comment?.created_at ||
            baseEvent?.issue?.updated_at ||
            baseEvent?.issue?.created_at ||
            Date.now(),
        ).toISOString(),
        payload: baseEvent,
        labels: opts.labels || [],
        provenance: { source: "cli" },
      };

  let githubEnrichment: any = {};
  if (!useGithub) {
    githubEnrichment = {
      provider: "github",
      partial: true,
      reason: "flag:not_set",
    };
  } else if (!token && !opts.octokit) {
    githubEnrichment = {
      provider: "github",
      partial: true,
      reason: "token:missing",
    };
  } else {
    try {
      const mod: any = await import("./enrichGithubEvent.js");
      const fn = (mod.enrichGithubEvent || mod.default) as (
        e: any,
        o?: any,
      ) => Promise<any>;
      const enriched = await fn(baseEvent, {
        token,
        commitLimit,
        fileLimit,
        octokit: opts.octokit,
        includePatch,
      });
      githubEnrichment = enriched?._enrichment || {};
      if (!includePatch) {
        if (githubEnrichment.pr?.files)
          githubEnrichment.pr.files = githubEnrichment.pr.files.map(
            (f: any) => ({ ...f, patch: undefined }),
          );
        if (githubEnrichment.push?.files)
          githubEnrichment.push.files = githubEnrichment.push.files.map(
            (f: any) => ({ ...f, patch: undefined }),
          );
      } else {
        if (githubEnrichment.pr?.files)
          githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) =>
            Object.prototype.hasOwnProperty.call(f, "patch")
              ? f
              : { ...f, patch: "" },
          );
        if (githubEnrichment.push?.files)
          githubEnrichment.push.files = githubEnrichment.push.files.map(
            (f: any) =>
              Object.prototype.hasOwnProperty.call(f, "patch")
                ? f
                : { ...f, patch: "" },
          );
      }
    } catch (e: any) {
      const errMessage = String(e?.message || e);
      if (opts.octokit) {
        githubEnrichment = {
          provider: "github",
          partial: true,
          errors: [{ message: errMessage }],
        };
      } else {
        return {
          code: 3,
          output: { error: `github enrichment failed: ${errMessage}` },
        };
      }
    }
  }

  try {
    if (useGithub) {
      const prPayload = (baseEvent as any)?.pull_request;
      if (prPayload) {
        if (!githubEnrichment || typeof githubEnrichment !== "object")
          githubEnrichment = {};
        githubEnrichment.pr = { ...(githubEnrichment.pr || {}) };
        if (githubEnrichment.pr.number == null && prPayload.number != null)
          githubEnrichment.pr.number = prPayload.number;
        if (
          githubEnrichment.pr.draft == null &&
          typeof prPayload.draft === "boolean"
        )
          githubEnrichment.pr.draft = prPayload.draft;
        if (
          githubEnrichment.pr.mergeable_state == null &&
          prPayload.mergeable_state != null
        )
          githubEnrichment.pr.mergeable_state = prPayload.mergeable_state;
      }
    }
  } catch {}

  const mentions: Mention[] = [];
  try {
    const pr = (baseEvent as any)?.pull_request;
    if (pr?.body) mentions.push(...extractMentions(String(pr.body), "pr_body"));
    if (pr?.title)
      mentions.push(...extractMentions(String(pr.title), "pr_title"));
    // Issue title/body mentions (issues.* events)
    const issue = (baseEvent as any)?.issue;
    if (issue?.title)
      mentions.push(...extractMentions(String(issue.title), "issue_title"));
    if (issue?.body)
      mentions.push(...extractMentions(String(issue.body), "issue_body"));
    const commits = (baseEvent as any)?.commits;
    if (Array.isArray(commits) && scanCommitMessagesFlag) {
      for (const c of commits)
        if (c?.message)
          mentions.push(
            ...extractMentions(String(c.message), "commit_message"),
          );
    }
    const commentBody = (baseEvent as any)?.comment?.body;
    if (commentBody && scanIssueCommentsFlag)
      mentions.push(...extractMentions(String(commentBody), "issue_comment"));
  } catch {}

  // Code comment mention scanning in changed files
  try {
    if (scanChangedFilesFlag) {
      const gh = githubEnrichment || {};
      const prFiles = Array.isArray(gh?.pr?.files) ? gh.pr.files : [];
      const pushFiles = Array.isArray(gh?.push?.files) ? gh.push.files : [];
      const files: { filename: string; patch?: string }[] = [
        ...prFiles,
        ...pushFiles,
      ].map((f: any) => ({ filename: f.filename, patch: f.patch }));
      const hasUsablePatch = files.some(
        (f) => typeof f.patch === "string" && !!f.patch,
      );

      if (includePatch && hasUsablePatch) {
        // Prefer scanning synthesized content from patches
        for (const f of files) {
          const filename = f.filename;
          const patch = f.patch || "";
          if (!filename || !patch || isBinaryPatch(patch)) continue;
          if (languageFiltersFlag && languageFiltersFlag.length) {
            // commentScanner expects language IDs (js,ts,py,...) — filter via detected lang there
          }
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
            maxBytes: maxFileBytesFlag,
            languageFilters: languageFiltersFlag,
            source: "code_comment",
          });
          if (found.length) mentions.push(...found);
        }
      } else if (useGithub) {
        // Fallback to fetching raw file contents (when allowed)
        const ghMeta = (githubEnrichment || {}) as any;
        let owner: string | undefined = ghMeta.owner;
        let repo: string | undefined = ghMeta.repo;
        let ref: string | undefined =
          (baseEvent as any)?.pull_request?.head?.sha ||
          (baseEvent as any)?.pull_request?.head?.ref ||
          (baseEvent as any)?.after ||
          (baseEvent as any)?.head_commit?.id;
        if (!owner || !repo) {
          const full = (baseEvent as any)?.repository?.full_name;
          if (typeof full === "string" && full.includes("/")) {
            const parts = full.split("/");
            owner = parts[0];
            repo = parts[1];
          }
        }
        const mod: any = await import("./enrichGithubEvent.js");
        const octokit =
          opts.octokit || (token ? mod.createOctokit?.(token) : undefined);
        let filesList: any[] = [...files];
        if ((!filesList || !filesList.length) && octokit && owner && repo) {
          if ((baseEvent as any)?.pull_request?.number) {
            try {
              const number = (baseEvent as any).pull_request.number;
              const list = await octokit.paginate(octokit.pulls.listFiles, {
                owner,
                repo,
                pull_number: number,
                per_page: 100,
              });
              filesList = Array.isArray(list) ? list : [];
            } catch {}
          } else if ((baseEvent as any)?.before && (baseEvent as any)?.after) {
            try {
              const comp = await octokit.repos.compareCommits({
                owner,
                repo,
                base: (baseEvent as any).before,
                head: (baseEvent as any).after,
              });
              filesList = (comp?.data?.files as any[]) || [];
              ref = (baseEvent as any).after;
            } catch {}
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
            const path = f.filename || f.path || f.name;
            if (!path) continue;
            try {
              const res = await octokit.repos.getContent({
                owner,
                repo,
                path,
                ref,
              });
              if (Array.isArray(res.data)) continue;
              const size = res.data.size ?? 0;
              if (maxFileBytesFlag > 0 && size > maxFileBytesFlag) continue;
              const encoding = res.data.encoding || "base64";
              const content: string = Buffer.from(
                res.data.content || "",
                encoding,
              ).toString("utf8");
              const found = scanMentionsInCodeComments({
                content,
                filename: path,
                maxBytes: maxFileBytesFlag,
                languageFilters: languageFiltersFlag,
                source: "code_comment",
              });
              if (found.length) mentions.push(...found);
            } catch {}
          }
        }
      }
    }
  } catch {}

  // De-duplicate mentions (per-source/location) before attaching to output
  const normalizedMentions: Mention[] = dedupeMentions(
    mentions.map((m) => normalizeCodeCommentLocation(m)),
  );

  const output: NormalizedEvent = {
    ...(neShell as any),
    enriched: {
      ...(neShell.enriched || {}),
      github: githubEnrichment,
      metadata: { ...(neShell.enriched?.metadata || {}), rules: opts.rules },
      derived: {
        ...(neShell.enriched?.derived || {}),
        flags: opts.flags || {},
      },
      ...(normalizedMentions.length ? { mentions: normalizedMentions } : {}),
    },
  };

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
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

// Normalize mentions.languages input: accept canonical codes (js,ts,py,go,java,c,cpp,sh,yaml,md)
// and common extensions (tsx->ts, jsx->js, yml->yaml, leading dots ignored). Case-insensitive.
function normalizeLanguageFilters(raw: unknown): string[] | undefined {
  const CANON = new Set([
    "js",
    "ts",
    "py",
    "go",
    "java",
    "c",
    "cpp",
    "sh",
    "yaml",
    "md",
  ]);
  const EXT_MAP: Record<string, string> = {
    tsx: "ts",
    jsx: "js",
    yml: "yaml",
    // also allow passing extensions with dots
    ".ts": "ts",
    ".tsx": "ts",
    ".js": "js",
    ".jsx": "js",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".md": "md",
    ".markdown": "md",
    ".c": "c",
    ".h": "c",
    ".cc": "cpp",
    ".cpp": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hh": "cpp",
    ".sh": "sh",
    ".bash": "sh",
    ".zsh": "sh",
    ".py": "py",
    ".go": "go",
    ".java": "java",
    ".mjs": "js",
    ".cjs": "js",
  };
  const arr: string[] = Array.isArray(raw)
    ? (raw as string[])
    : typeof raw === "string" && raw.length
      ? String(raw).split(",")
      : [];
  const out: string[] = [];
  for (const item of arr) {
    const k = String(item).trim();
    if (!k) continue;
    const lower = k.toLowerCase();
    if (CANON.has(lower)) {
      out.push(lower);
      continue;
    }
    const mapped = EXT_MAP[lower] ?? EXT_MAP[lower.replace(/^\./, "")];
    if (mapped && CANON.has(mapped)) out.push(mapped);
  }
  return out.length ? Array.from(new Set(out)) : undefined;
}

function toInt(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalizeCodeCommentLocation(m: Mention): Mention {
  if (
    m &&
    m.source === "code_comment" &&
    typeof (m as any).location === "string"
  ) {
    const loc = String((m as any).location);
    const idx = loc.lastIndexOf(":");
    if (idx > 0) {
      const file = loc.slice(0, idx);
      const lineStr = loc.slice(idx + 1);
      const line = Number.parseInt(lineStr, 10);
      return {
        ...m,
        location: { file, line: Number.isFinite(line) ? line : undefined },
      } as Mention;
    }
  }
  return m;
}
