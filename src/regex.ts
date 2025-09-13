// Basic mention regex: matches @identifier with letters, digits, dashes, underscores, dots
// Allow slash to capture org/team style mentions like @org/team
export const MENTION_RE = /(^|\W)@([a-zA-Z0-9._/-]{1,64})\b/g;

export function normalizeTarget(raw: string): string {
  return raw.trim().toLowerCase();
}

export function inferKind(target: string, knownAgents?: string[]): 'agent' | 'user' | 'team' | 'unknown' {
  const t = normalizeTarget(target);
  if (knownAgents && knownAgents.map((a) => a.toLowerCase()).includes(t)) return 'agent';
  if (t.endsWith('-agent')) return 'agent';
  if (t.includes('/')) return 'team';
  return 'unknown';
}
