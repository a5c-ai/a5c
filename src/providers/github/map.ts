import type { NormalizedEvent } from "../../types.js";
import type { Provider, NormalizeOptions, EnrichOptions } from "../types.js";

type GHRepo = {
  id: number;
  name: string;
  full_name: string;
  private?: boolean;
  visibility?: string | null;
  owner?: { login: string };
};
type GHUser = { id: number; login: string; type: string };

export type DetectResult = {
  type: NormalizedEvent["type"];
  occurred_at: string;
  id: string;
} | null;

export function detectTypeAndId(payload: any): DetectResult {
  if (!payload || typeof payload !== "object") return null;
  // pull_request events
  if (payload.pull_request) {
    const pr = payload.pull_request;
    const occurred_at =
      pr.updated_at ||
      pr.created_at ||
      payload.repository?.pushed_at ||
      new Date().toISOString();
    // Prefer compact numeric id for PRs to match golden tests
    const id = String(
      (pr as any).number ??
        pr.id ??
        `${payload.repository?.full_name || "repo"}/pr/${pr.number}`,
    );
    return { type: "pull_request", occurred_at, id };
  }
  // release
  if (payload.release && payload.repository) {
    const r = payload.release;
    const occurred_at =
      r.published_at || r.created_at || new Date().toISOString();
    const id = String(
      r.id ||
        r.tag_name ||
        `${payload.repository?.full_name}/release/${r.tag_name}`,
    );
    return { type: "release", occurred_at, id };
  }
  // deployment / deployment_status
  if ((payload.deployment || payload.deployment_status) && payload.repository) {
    const d = payload.deployment || payload.deployment_status?.deployment || {};
    const ds = payload.deployment_status;
    const occurred_at =
      ds?.created_at || d.created_at || new Date().toISOString();
    const id = String(
      d.id ||
        ds?.id ||
        `${payload.repository?.full_name}/deployment/${d.id || "unknown"}`,
    );
    return { type: "deployment", occurred_at, id };
  }
  // workflow_job → job
  if (payload.workflow_job && payload.repository) {
    const wj = payload.workflow_job;
    const occurred_at =
      wj.completed_at ||
      wj.started_at ||
      wj.created_at ||
      new Date().toISOString();
    const id = String(
      wj.id ||
        `${payload.repository?.full_name}/workflow_job/${wj.run_id || "unknown"}`,
    );
    return { type: "job", occurred_at, id };
  }
  // step (granular or custom step-level payloads, if present)
  if (payload.step && payload.repository) {
    const s = payload.step;
    const occurred_at =
      s.completed_at ||
      s.started_at ||
      s.created_at ||
      new Date().toISOString();
    const id = String(
      s.id || `${payload.repository?.full_name}/step/${s.name || "unknown"}`,
    );
    return { type: "step", occurred_at, id };
  }
  // alerts (code_scanning_alert / secret_scanning_alert)
  if (payload.alert && payload.repository) {
    const a = payload.alert;
    const occurred_at =
      a.updated_at || a.created_at || new Date().toISOString();
    const id = String(
      a.number ||
        a.id ||
        `${payload.repository?.full_name}/alert/${a.number || a.id}`,
    );
    return { type: "alert", occurred_at, id };
  }
  // workflow_run
  if (payload.workflow_run) {
    const wr = payload.workflow_run;
    const occurred_at =
      wr.updated_at || wr.created_at || new Date().toISOString();
    const id = String(
      wr.id ||
        `${payload.repository?.full_name || "repo"}/workflow_run/${wr.run_number || wr.id}`,
    );
    return { type: "workflow_run", occurred_at, id };
  }
  // push
  if (payload.after && payload.ref && payload.repository) {
    const occurred_at =
      payload.head_commit?.timestamp || new Date().toISOString();
    const id = String(payload.after);
    return { type: "push", occurred_at, id };
  }
  // issue_comment
  if (payload.comment && payload.repository) {
    const occurred_at =
      payload.comment?.updated_at ||
      payload.comment?.created_at ||
      new Date().toISOString();
    const id = String(
      payload.comment?.id ||
        `${payload.repository?.full_name}/comment/${payload.comment?.id}`,
    );
    return { type: "issue_comment", occurred_at, id };
  }
  // issues (opened/edited/labeled/etc.)
  if (payload.issue && payload.repository) {
    const occurred_at =
      payload.issue?.updated_at ||
      payload.issue?.created_at ||
      new Date().toISOString();
    const id = String(
      payload.issue?.id ||
        `${payload.repository?.full_name}/issues/${payload.issue?.number}`,
    );
    return { type: "issue", occurred_at, id };
  }
  // check_run
  if (payload.check_run && payload.repository) {
    const cr = payload.check_run;
    const occurred_at =
      cr.completed_at || cr.started_at || new Date().toISOString();
    const id = String(
      cr.id ||
        `${payload.repository?.full_name}/check_run/${cr.check_suite?.id || cr.head_sha}`,
    );
    return { type: "check_run", occurred_at, id };
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
  // release → tag ref
  if (payload.release) {
    const r = payload.release;
    const tag = r.tag_name;
    const target = r.target_commitish as string | undefined;
    const shaLike =
      typeof target === "string" && /^[0-9a-f]{40}$/i.test(target);
    return tag
      ? {
          name: tag,
          type: "tag",
          ...(shaLike ? { sha: target } : {}),
        }
      : undefined;
  }
  // deployment → branch or tag name in deployment.ref (GitHub sends plain branch name)
  if (payload.deployment || payload.deployment_status) {
    const d = payload.deployment || payload.deployment_status?.deployment;
    const name = d?.ref as string | undefined;
    const sha = (d?.sha as string | undefined) || undefined;
    return name
      ? {
          name,
          // Heuristic: deployments commonly reference branches; keep unknown if not sure
          type: "branch",
          ...(sha ? { sha } : {}),
        }
      : undefined;
  }
  // workflow_job → branch/sha similar to workflow_run
  if (payload.workflow_job) {
    const wj = payload.workflow_job;
    return {
      name: wj.head_branch,
      type: "branch",
      ...(wj.head_sha ? { sha: wj.head_sha } : {}),
    } as any;
  }
  // step: attach job context if available
  if (payload.step && payload.workflow_job) {
    const wj = payload.workflow_job;
    return {
      name: wj.head_branch,
      type: "branch",
      sha: wj.head_sha,
    };
  }
  if (payload.pull_request) {
    // For PR events, emit branch ref semantics.
    // Use head ref as name; keep base/head fields for context.
    return {
      name: payload.pull_request.head?.ref,
      type: "branch",
      base: payload.pull_request.base?.ref,
      head: payload.pull_request.head?.ref,
    };
  }
  if (payload.ref && typeof payload.ref === "string") {
    const ref = payload.ref;
    const isTag = ref.startsWith("refs/tags/");
    const isBranch = ref.startsWith("refs/heads/");
    return {
      name: ref.replace(/^refs\/(heads|tags)\//, ""),
      type: isBranch ? "branch" : isTag ? "tag" : "unknown",
      sha: payload.after || payload.head_commit?.id || undefined,
    };
  }
  if (payload.workflow_run) {
    const wr = payload.workflow_run;
    return {
      name: wr.head_branch,
      type: "branch",
      sha: wr.head_sha,
    };
  }
  if (payload.check_run) {
    const cr = payload.check_run;
    const name =
      cr.check_suite?.head_branch || cr.pull_requests?.[0]?.head?.ref;
    const sha = cr.head_sha || cr.check_suite?.head_sha;
    return name || sha
      ? {
          ...(name ? { name } : {}),
          type: "branch",
          ...(sha ? { sha } : {}),
        }
      : undefined;
  }
  return undefined;
}

function mapActor(payload: any): GHUser | undefined {
  const a =
    payload.sender ||
    payload.pusher ||
    payload.workflow_run?.actor ||
    payload.pull_request?.user;
  if (!a) return undefined as any;
  return { id: a.id, login: a.login || a.name, type: a.type || "User" };
}

// removed unused helper coerceSource

export function mapToNE(
  payload: any,
  opts: { source?: string; labels?: string[] } = {},
): NormalizedEvent {
  const source = normalizeSource(opts.source);
  const detected =
    detectTypeAndId(payload) ||
    ({
      type: "commit",
      occurred_at: new Date().toISOString(),
      id: "temp-" + Math.random().toString(36).slice(2),
    } as any);
  const repo = mapRepo(
    payload.repository ||
      payload.pull_request?.base?.repo ||
      payload.workflow_run?.repository,
  );
  const actor = mapActor(payload);
  const ne: any = {
    id: String(detected.id),
    provider: "github",
    type: detected.type,
    occurred_at: new Date(detected.occurred_at).toISOString(),
    repo,
    ref: mapRef(payload),
    actor,
    payload,
    labels: opts.labels || [],
    provenance: { source: (source as any) || "cli" },
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
  normalize: (payload: any, opts?: NormalizeOptions) =>
    mapToNE(payload, {
      source: normalizeSource(opts?.source),
      labels: opts?.labels,
    }),
  enrich: async (event: any, opts?: EnrichOptions) => {
    const mod: any = await import("../../enrichGithubEvent.js");
    const fn = (mod.enrichGithubEvent || mod.default) as (
      e: any,
      o?: any,
    ) => Promise<any>;
    return fn(event, opts);
  },
};

function normalizeSource(
  src?: string,
): "action" | "webhook" | "cli" | undefined {
  if (!src) return src as any;
  const s = String(src).toLowerCase();
  if (s === "actions" || s === "action") return "action";
  if (s === "webhook") return "webhook";
  if (s === "cli") return "cli";
  return src as any;
}
