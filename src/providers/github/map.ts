import type { NormalizedEvent } from '../../types.js';
import type { Provider, NormalizeOptions, EnrichOptions } from '../types.js';

type GHRepo = { id: number; name: string; full_name: string; private?: boolean; visibility?: string | null; owner?: { login: string } };
type GHUser = { id: number; login: string; type: string };

export type DetectResult = { type: NormalizedEvent['type']; occurred_at: string; id: string } | null;

export function detectTypeAndId(payload: any): DetectResult {
  if (!payload || typeof payload !== 'object') return null;
  // pull_request events
  if (payload.pull_request) {
    const pr = payload.pull_request;
    const occurred_at = pr.updated_at || pr.created_at || payload.repository?.pushed_at || new Date().toISOString();
    // Prefer compact numeric id for PRs to match golden tests
    const id = String((pr as any).number ?? pr.id ?? `${payload.repository?.full_name || 'repo'}/pr/${pr.number}`);
    return { type: 'pull_request', occurred_at, id };
  }
  // workflow_run
  if (payload.workflow_run) {
    const wr = payload.workflow_run;
    const occurred_at = wr.updated_at || wr.created_at || new Date().toISOString();
    const id = String(wr.id || `${payload.repository?.full_name || 'repo'}/workflow_run/${wr.run_number || wr.id}`);
    return { type: 'workflow_run', occurred_at, id };
  }
  // push
  if (payload.after && payload.ref && payload.repository) {
    const occurred_at = payload.head_commit?.timestamp || new Date().toISOString();
    const id = String(payload.after);
    return { type: 'push', occurred_at, id };
  }
  // issue_comment
  if (payload.comment && payload.repository) {
    const occurred_at = payload.comment?.updated_at || payload.comment?.created_at || new Date().toISOString();
    const id = String(payload.comment?.id || `${payload.repository?.full_name}/comment/${payload.comment?.id}`);
    return { type: 'issue_comment', occurred_at, id };
  }
  // issues (opened/edited/labeled/etc.)
  if (payload.issue && payload.repository) {
    const occurred_at = payload.issue?.updated_at || payload.issue?.created_at || new Date().toISOString();
    const id = String(payload.issue?.id || `${payload.repository?.full_name}/issues/${payload.issue?.number}`);
    return { type: 'issues', occurred_at, id };
  }
  // check_run
  if (payload.check_run && payload.repository) {
    const cr = payload.check_run;
    const occurred_at = cr.completed_at || cr.started_at || new Date().toISOString();
    const id = String(cr.id || `${payload.repository?.full_name}/check_run/${cr.check_suite?.id || cr.head_sha}`);
    return { type: 'check_run', occurred_at, id };
  }
  return null;
}

function mapRepo(repo: GHRepo | undefined) {
  if (!repo) return undefined;
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    visibility: (repo as any).visibility ?? null,
  };
}

function mapRef(payload: any) {
  if (payload.pull_request) {
    // NE schema update: treat PR ref as explicit 'pr' type for tests/spec
    return {
      name: payload.pull_request.head?.ref,
      type: 'pr',
      base: payload.pull_request.base?.ref,
      head: payload.pull_request.head?.ref,
    };
  }
  if (payload.ref && typeof payload.ref === 'string') {
    const ref = payload.ref;
    const isTag = ref.startsWith('refs/tags/');
    const isBranch = ref.startsWith('refs/heads/');
    return {
      name: ref.replace(/^refs\/(heads|tags)\//, ''),
      type: isBranch ? 'branch' : isTag ? 'tag' : 'unknown',
      sha: payload.after || payload.head_commit?.id || undefined,
    };
  }
  if (payload.workflow_run) {
    const wr = payload.workflow_run;
    return {
      name: wr.head_branch,
      type: 'branch',
      sha: wr.head_sha,
    };
  }
  if (payload.check_run) {
    const cr = payload.check_run;
    const name = cr.check_suite?.head_branch || cr.pull_requests?.[0]?.head?.ref;
    const sha = cr.head_sha || cr.check_suite?.head_sha;
    return (name || sha)
      ? {
          ...(name ? { name } : {}),
          type: 'branch',
          ...(sha ? { sha } : {}),
        }
      : undefined;
  }
  return undefined;
}

function mapActor(payload: any): GHUser | undefined {
  const a = payload.sender || payload.pusher || payload.workflow_run?.actor || payload.pull_request?.user;
  if (!a) return undefined as any;
  return { id: a.id, login: a.login || a.name, type: a.type || 'User' };
}

export function mapToNE(payload: any, opts: { source?: string; labels?: string[] } = {}): NormalizedEvent {
  const detected = detectTypeAndId(payload) || { type: 'commit', occurred_at: new Date().toISOString(), id: 'temp-' + Math.random().toString(36).slice(2) } as any;
  const repo = mapRepo(payload.repository || payload.pull_request?.base?.repo || payload.workflow_run?.repository);
  const actor = mapActor(payload);
  const ne: any = {
    id: String(detected.id),
    provider: 'github',
    type: detected.type,
    occurred_at: new Date(detected.occurred_at).toISOString(),
    repo,
    ref: mapRef(payload),
    actor,
    payload,
    labels: opts.labels || [],
    provenance: { source: (opts.source as any) || 'cli' },
  };
  // Optional workflow provenance enrichment when workflow_run is present
  if (payload?.workflow_run) {
    const wr = payload.workflow_run as any;
    const wfName = wr.name || wr.display_title || undefined;
    const runId = wr.id ?? wr.run_id ?? undefined;
    if (wfName || runId) {
      ne.provenance.workflow = {
        ...(wfName ? { name: String(wfName) } : {}),
        ...(runId != null ? { run_id: runId } : {}),
      };
    }
  }
  return ne as NormalizedEvent;
}

// Optional: expose a Provider-compatible adapter without changing existing exports
export const GitHubProvider: Provider = {
  normalize: (payload: any, opts?: NormalizeOptions) => mapToNE(payload, { source: opts?.source, labels: opts?.labels }),
  enrich: async (event: any, opts?: EnrichOptions) => {
    const mod: any = await import('../../enrichGithubEvent.js')
    const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
    return fn(event, opts)
  }
}
