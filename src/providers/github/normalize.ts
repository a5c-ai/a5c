import type { NormalizedEvent } from "../../types.js";

type AnyObj = Record<string, any>;

export type GithubEventPayload = AnyObj;

export function normalizeGithub(
  payload?: GithubEventPayload,
  opts?: {
    source?: string;
    labels?: string[];
  },
): NormalizedEvent {
  const now = new Date().toISOString();
  const base: NormalizedEvent = {
    id: inferId(payload),
    provider: "github",
    type: inferType(payload),
    occurred_at: inferOccurredAt(payload) || now,
    payload,
    labels: opts?.labels || [],
    provenance: buildProvenance(payload, opts?.source),
  };

  const repo = inferRepo(payload);
  const ref = inferRef(payload);
  const actor = inferActor(payload);
  return {
    ...base,
    ...(repo && { repo }),
    ...(ref && { ref }),
    ...(actor && { actor }),
  } as NormalizedEvent;
}

function inferType(p?: AnyObj): string {
  if (!p || typeof p !== "object") return "unknown";
  if (p.workflow_run) return "workflow_run";
  if (p.pull_request) return "pull_request";
  if (typeof p.ref === "string" && p.after && p.commits) return "push";
  if (p.comment && p.issue) return "issue_comment";
  return "unknown";
}

function inferId(p?: AnyObj): string {
  if (!p) return "temp-" + Math.random().toString(36).slice(2);
  if (p.workflow_run?.id) return String(p.workflow_run.id);
  if (p.pull_request?.number) return String(p.pull_request.number);
  if (p.after && typeof p.after === "string") return String(p.after);
  if (p.comment?.id) return String(p.comment.id);
  return "temp-" + Math.random().toString(36).slice(2);
}

function inferOccurredAt(p?: AnyObj): string | undefined {
  const iso =
    p?.workflow_run?.updated_at ||
    p?.workflow_run?.created_at ||
    p?.pull_request?.updated_at ||
    p?.pull_request?.created_at ||
    p?.head_commit?.timestamp ||
    p?.comment?.created_at;
  return iso && typeof iso === "string" ? iso : undefined;
}

function inferRepo(p?: AnyObj): AnyObj | undefined {
  const r = p?.repository;
  if (!r) return undefined;
  const out: AnyObj = {};
  if (r.id !== undefined) out.id = r.id;
  if (r.name) out.name = r.name;
  if (r.full_name) out.full_name = r.full_name;
  if (r.private !== undefined) out.private = r.private;
  if (r.visibility) out.visibility = r.visibility;
  return out;
}

function inferRef(p?: AnyObj): AnyObj | undefined {
  if (!p) return undefined;
  // workflow_run
  if (p.workflow_run) {
    const wr = p.workflow_run;
    return {
      name: wr.head_branch,
      type: "branch",
      sha: wr.head_sha,
    };
  }
  // pull_request
  if (p.pull_request) {
    const pr = p.pull_request;
    return {
      name: pr.head?.ref,
      type: "branch",
      head: pr.head?.ref,
      base: pr.base?.ref,
    };
  }
  // push
  if (typeof p.ref === "string" && p.after) {
    const name = p.ref.startsWith("refs/heads/")
      ? p.ref.replace("refs/heads/", "")
      : p.ref;
    return { name, type: "branch", sha: p.after };
  }
  // issue_comment might not carry a ref; skip
  return undefined;
}

function inferActor(p?: AnyObj): AnyObj | undefined {
  if (!p) return undefined;
  const s = p.sender || p.comment?.user || p.pusher;
  if (!s) return undefined;
  const out: AnyObj = {};
  if (s.id !== undefined) out.id = s.id;
  if (s.login || s.name) out.login = s.login || s.name;
  if (s.type) out.type = s.type;
  return out;
}

function buildProvenance(p?: AnyObj, source?: string): AnyObj | undefined {
  const prov: AnyObj = { source: source || "cli" };
  if (p?.workflow_run) {
    const wr = p.workflow_run;
    // Limit workflow provenance to NE schema allowed fields { name, run_id }
    prov.workflow = { name: wr.name, run_id: wr.id };
  }
  return prov;
}
