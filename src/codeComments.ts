import type { Mention, ExtractorOptions } from "./types.js";
import { extractMentions, dedupeMentions } from "./extractor.js";

// Patch-based helpers (diff scanning)
type Lang = "js" | "ts" | "tsx" | "jsx" | "unknown";

export function extToLang(filename: string): Lang {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] || "";
  if (ext === "js") return "js";
  if (ext === "ts") return "ts";
  if (ext === "tsx") return "tsx";
  if (ext === "jsx") return "jsx";
  return "unknown";
}

export function isBinaryPatch(patch?: string | null): boolean {
  if (!patch) return true;
  if (patch.includes("GIT binary patch")) return true;
  return false;
}

export function parseAddedLinesWithNumbers(
  patch: string,
): Array<{ line: number; text: string }> {
  const out: Array<{ line: number; text: string }> = [];
  let newLine = 0;
  for (const raw of patch.split(/\r?\n/)) {
    if (raw.startsWith("@@")) {
      const m = raw.match(/\+([0-9]+)(?:,([0-9]+))?/);
      newLine = m ? parseInt(m[1], 10) : 0;
      continue;
    }
    if (!raw) continue;
    const sign = raw[0];
    const text = raw.slice(1);
    if (sign === "+") {
      out.push({ line: newLine, text });
      newLine++;
    } else if (sign === " ") {
      newLine++;
    } else if (sign === "-") {
      // removed line, do not advance newLine
    }
  }
  return out;
}

export function isCommentLine(
  line: string,
  lang: Lang,
  state: { inBlock: boolean },
): boolean {
  const trimmed = line.trim();
  if (lang === "js" || lang === "ts" || lang === "tsx" || lang === "jsx") {
    if (trimmed.startsWith("//")) return true;
    if (trimmed.includes("/*")) state.inBlock = true;
    if (state.inBlock) {
      if (trimmed.includes("*/")) state.inBlock = false;
      return true;
    }
  }
  return false;
}

export function scanPatchForCodeCommentMentions(
  filename: string,
  patch: string,
  opts: { window?: number; knownAgents?: string[] },
): Mention[] {
  const lang = extToLang(filename);
  const added = parseAddedLinesWithNumbers(patch);
  const mentions: Mention[] = [];
  const state = { inBlock: false };
  for (const { line, text } of added) {
    if (!isCommentLine(text, lang, state)) continue;
    const found = extractMentions(text, "code_comment", {
      window: opts.window ?? 30,
      knownAgents: opts.knownAgents || [],
    });
    for (const m of found) {
      m.location = { file: filename, line };
      m.confidence = Math.min(1, Math.max(0, (m.confidence ?? 0.9) - 0.05));
      mentions.push(m);
    }
  }
  return mentions;
}

// Octokit-backed file content scanning
type Octokit = any;

export interface ScanOptions extends ExtractorOptions {
  fileSizeCapBytes?: number;
  languageFilters?: string[];
}

export interface FileRef {
  filename: string;
}

export async function scanCodeCommentsForMentions(params: {
  owner: string;
  repo: string;
  ref: string;
  files: FileRef[];
  octokit: Octokit;
  options?: ScanOptions;
}): Promise<Mention[]> {
  const { owner, repo, ref, files, octokit } = params;
  const options = params.options || {};
  const cap = options.fileSizeCapBytes ?? 200 * 1024;
  const langFilters = options.languageFilters?.map((s) => s.toLowerCase());

  const out: Mention[] = [];
  for (const f of files) {
    const path = f.filename;
    const lang = detectLanguage(path);
    if (langFilters && lang && !langFilters.includes(lang)) continue;
    if (!lang) continue;

    try {
      const res = await octokit.repos.getContent({ owner, repo, path, ref });
      if (Array.isArray(res.data)) continue;
      const size = res.data.size ?? 0;
      if (cap > 0 && size > cap) continue;
      const encoding = res.data.encoding || "base64";
      const content: string = Buffer.from(
        res.data.content || "",
        encoding,
      ).toString("utf8");
      const mentions = scanContentForMentions(content, path, lang, options);
      out.push(...mentions);
    } catch {
      // ignore fetch errors per-file
    }
  }
  return dedupeMentions(out);
}

function detectLanguage(filename: string): "js" | "md" | "ts" | null {
  const lower = filename.toLowerCase();
  if (/(\.m?jsx?|\.cjs|\.mjs)$/.test(lower)) return "js";
  if (/(\.tsx?|\.d\.ts)$/.test(lower)) return "ts";
  if (/(\.md|\.markdown)$/.test(lower)) return "md";
  return null;
}

function scanContentForMentions(
  content: string,
  path: string,
  lang: "js" | "ts" | "md",
  options: ExtractorOptions,
): Mention[] {
  switch (lang) {
    case "js":
    case "ts":
      return scanJsLike(content, path, options);
    case "md":
      return scanMarkdown(content, path, options);
  }
}

function scanMarkdown(
  content: string,
  path: string,
  options: ExtractorOptions,
): Mention[] {
  const out: Mention[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i];
    const found = extractMentions(line, "code_comment", options);
    for (const m of found)
      out.push({ ...m, location: { file: path, line: lineNo } });
  }
  return out;
}

function scanJsLike(
  content: string,
  path: string,
  options: ExtractorOptions,
): Mention[] {
  const out: Mention[] = [];

  // Block comments
  const blockRe = /\/\*[\s\S]*?\*\//g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(content))) {
    const snippet = m[0];
    const startIdx = m.index;
    const mentions = extractMentions(snippet, "code_comment", options);
    for (const mm of mentions) {
      const relIdx = snippet.indexOf(
        mm.target.startsWith("@") ? mm.target : "@" + mm.target,
      );
      const absIdx = relIdx >= 0 ? startIdx + relIdx : startIdx;
      const lineNo = 1 + countNewlines(content, absIdx);
      out.push({ ...mm, location: { file: path, line: lineNo } });
    }
  }

  // Line comments
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf("//");
    if (idx >= 0) {
      const comment = line.slice(idx);
      const found = extractMentions(comment, "code_comment", options);
      for (const mm of found)
        out.push({ ...mm, location: { file: path, line: i + 1 } });
    }
  }
  return out;
}

function countNewlines(text: string, endExclusive: number): number {
  let count = 0;
  for (let i = 0; i < endExclusive; i++) if (text.charCodeAt(i) === 10) count++;
  return count;
}
