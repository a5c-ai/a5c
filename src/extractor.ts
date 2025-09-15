import { MENTION_RE, inferKind, normalizeTarget } from "./regex.js";
import type { ExtractorOptions, Mention, MentionSource } from "./types.js";

const DEFAULT_ENABLED: Record<MentionSource, boolean> = {
  commit_message: true,
  pr_body: true,
  pr_title: true,
  issue_body: true,
  issue_title: true,
  issue_comment: true,
  code_comment: true,
};

export function extractMentions(
  text: string,
  source: MentionSource,
  options: ExtractorOptions = {},
): Mention[] {
  const enabled = { ...DEFAULT_ENABLED, ...(options.enabledSources || {}) };
  if (!enabled[source]) return [];

  const window = options.window ?? 30; // chars around mention
  const knownAgents = options.knownAgents || [];

  const mentions: Mention[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE); // fresh stateful copy
  while ((match = re.exec(text)) !== null) {
    const raw = match[2];
    const start = Math.max(0, match.index - window);
    const end = Math.min(text.length, re.lastIndex + window);
    const context = text.slice(start, end).replace(/\s+/g, " ").trim();
    const normalized = normalizeTarget(raw);
    const kind = inferKind(raw, knownAgents);
    const confidence = kind === "agent" ? 0.9 : 0.6; // heuristic baseline

    mentions.push({
      target: raw,
      normalized_target: normalized,
      kind,
      source,
      context,
      confidence,
    });
  }
  return dedupeMentions(mentions);
}

export function dedupeMentions(items: Mention[]): Mention[] {
  const seen = new Set<string>();
  const out: Mention[] = [];
  for (const m of items) {
    const locKey =
      typeof (m as any).location === "object" && (m as any).location
        ? `${(m as any).location.file || ""}:${(m as any).location.line ?? ""}`
        : String((m as any).location || "");
    const key = `${m.source}|${m.normalized_target}|${locKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}
