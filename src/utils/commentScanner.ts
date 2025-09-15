import path from "node:path";
import { MENTION_RE, inferKind, normalizeTarget } from "../regex.js";
import type { Mention } from "../types.js";

type Lang =
  | "js"
  | "ts"
  | "py"
  | "go"
  | "java"
  | "c"
  | "cpp"
  | "sh"
  | "yaml"
  | "md";

const EXT_TO_LANG: Record<string, Lang> = {
  ".js": "js",
  ".mjs": "js",
  ".cjs": "js",
  ".jsx": "js",
  ".ts": "ts",
  ".tsx": "ts",
  ".py": "py",
  ".go": "go",
  ".java": "java",
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
  ".yaml": "yaml",
  ".yml": "yaml",
  ".md": "md",
  ".markdown": "md",
};

export function detectLang(filename: string): Lang | undefined {
  const ext = path.extname(filename).toLowerCase();
  return EXT_TO_LANG[ext];
}

// Extract line-comment tokens from a given language line
function lineCommentPrefix(lang: Lang): string[] {
  switch (lang) {
    case "js":
    case "ts":
    case "java":
    case "c":
    case "cpp":
    case "go":
      return ["//"];
    case "py":
    case "sh":
    case "yaml":
      return ["#"];
    case "md":
      return [];
    default:
      return [];
  }
}

function blockCommentDelims(lang: Lang): [string, string][] {
  switch (lang) {
    case "js":
    case "ts":
    case "java":
    case "c":
    case "cpp":
      return [["/*", "*/"]];
    case "md":
      return [];
    default:
      return [];
  }
}

export function scanMentionsInCodeComments(params: {
  content: string;
  filename: string;
  window?: number;
  knownAgents?: string[];
  maxBytes?: number;
  enabled?: boolean;
  languageFilters?: string[];
  source?: "code_comment";
}): Mention[] {
  const {
    content,
    filename,
    window = 30,
    knownAgents = [],
    maxBytes = 200 * 1024,
    enabled = true,
    languageFilters,
  } = params;

  if (!enabled) return [];
  // bytes cap
  if (Buffer.byteLength(content, "utf8") > maxBytes) return [];

  const lang = detectLang(filename);
  if (!lang) return [];
  if (
    languageFilters &&
    languageFilters.length &&
    !languageFilters.includes(lang)
  )
    return [];

  const mentions: Mention[] = [];
  const lc = lineCommentPrefix(lang);
  const bc = blockCommentDelims(lang);

  if (lang === "md") {
    const lines = content.split(/\r?\n/);
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      collectMentions(line, content, offset, filename, i + 1);
      offset += line.length + 1;
    }
    return dedupe(mentions);
  }

  // First, scan block comments via a simple state machine
  if (bc.length) {
    for (const [open, close] of bc) {
      let idx = 0;
      while (idx < content.length) {
        const start = content.indexOf(open, idx);
        if (start === -1) break;
        const end = content.indexOf(close, start + open.length);
        if (end === -1) break;
        const block = content.slice(start + open.length, end);
        collectMentions(block, content, start, filename);
        idx = end + close.length;
      }
    }
  }

  // Then scan line comments
  if (lc.length) {
    const lines = content.split(/\r?\n/);
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pfx of lc) {
        const pos = line.indexOf(pfx);
        if (pos >= 0) {
          const text = line.slice(pos + pfx.length);
          collectMentions(text, content, offset + pos, filename, i + 1);
          break;
        }
      }
      offset += line.length + 1;
    }
  }

  return dedupe(mentions);

  function collectMentions(
    snippet: string,
    whole: string,
    absIndex: number,
    file: string,
    lineHint?: number,
  ) {
    const re = new RegExp(MENTION_RE);
    let m: RegExpExecArray | null;
    while ((m = re.exec(snippet)) !== null) {
      const raw = m[2];
      const normalized = normalizeTarget(raw);
      const kind = inferKind(raw, knownAgents);
      const sIdx = absIndex + m.index;
      const start = Math.max(0, sIdx - window);
      const end = Math.min(whole.length, sIdx + m[0].length + window);
      const context = whole.slice(start, end).replace(/\s+/g, " ").trim();
      let line: number | undefined = lineHint;
      if (!line) {
        // compute line from absolute index
        line = 1 + (whole.slice(0, sIdx).match(/\n/g)?.length || 0);
      }
      mentions.push({
        target: raw,
        normalized_target: normalized,
        kind,
        source: "code_comment",
        location: { file, line },
        context,
        confidence: kind === "agent" ? 0.85 : 0.6,
      });
    }
  }
}

function dedupe(items: Mention[]): Mention[] {
  const seen = new Set<string>();
  const out: Mention[] = [];
  for (const m of items) {
    const file =
      typeof m.location === "object" && m.location ? m.location.file : "";
    const line = typeof m.location === "object" && (m.location as any)?.line;
    const key = `${m.source}|${m.normalized_target}|${file}:${line || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}
