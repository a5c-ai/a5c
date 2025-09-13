export type MentionKind = 'agent' | 'user' | 'team' | 'unknown';

export type MentionSource =
  | 'commit_message'
  | 'pr_body'
  | 'pr_title'
  | 'issue_body'
  | 'issue_title'
  | 'issue_comment'
  | 'code_comment';

export interface Mention {
  target: string;
  normalized_target: string;
  kind: MentionKind;
  source: MentionSource;
  location?: string; // path:line or ref
  context: string; // excerpt around the mention
  confidence: number; // 0..1
}

export interface ExtractorOptions {
  enabledSources?: Partial<Record<MentionSource, boolean>>;
  fileSizeCapBytes?: number;
  languageFilters?: string[]; // e.g., ['js','ts','py']
  window?: number; // context window around mention
  knownAgents?: string[]; // list of known agent names to boost confidence
}

// Minimal normalized event type used by existing CLI utilities in this repo
export interface NormalizedEvent {
  id: string;
  provider: string; // e.g., 'github'
  type: string; // event type
  occurred_at: string; // ISO timestamp
  repo?: {
    id: number;
    name: string;
    full_name: string;
    private?: boolean;
    visibility?: 'public' | 'private' | 'internal' | null;
  };
  ref?: {
    name?: string;
    type?: 'branch' | 'tag' | 'unknown' | null;
    sha?: string;
    base?: string;
    head?: string;
  };
  actor?: {
    id: number;
    login: string;
    type: string;
  };
  payload?: unknown;
  labels?: string[];
  provenance?: { source?: string; [k: string]: unknown };
  enriched?: {
    metadata?: Record<string, unknown> | null;
    derived?: Record<string, unknown> | null;
    [k: string]: unknown;
  };
}
