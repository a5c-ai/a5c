import { NormalizedEvent } from './types.js'
import { readJSONFile } from './config.js'

type AnyObj = Record<string, any>
export async function handleNormalize(opts: {
  in?: string
  source?: string
  labels?: string[]
}): Promise<{ code: number; output: NormalizedEvent }>{
  const payload = (readJSONFile<AnyObj>(opts.in) || {}) as AnyObj
  const now = new Date().toISOString()

  const type = detectType(payload)
  const repo = selectRepo(payload)
  const actor = selectActor(payload)
  const ref = buildRef(payload, type)
  const occurredAt = selectOccurredAt(payload, type) || now
  const id = selectEventId(payload, type) || `temp-${Math.random().toString(36).slice(2)}`

  const provenanceSource = normalizeSource(opts.source)

  const output: NormalizedEvent = {
    id: String(id),
    provider: 'github',
    type,
    occurred_at: occurredAt,
    repo,
    ...(ref ? { ref } : {}),
    actor,
    payload,
    labels: opts.labels || [],
    provenance: { source: provenanceSource }
  }

  // Add workflow provenance details when available (NE optional but requested)
  if (type === 'workflow_run' && payload?.workflow_run) {
    const wr = payload.workflow_run as AnyObj
    const wfName = String(wr.name || '')
    const runId = wr.id ?? wr.run_id ?? undefined
    if (wfName || runId) {
      ;(output.provenance as AnyObj).workflow = {
        ...(wfName ? { name: wfName } : {}),
        ...(runId != null ? { run_id: runId } : {})
      }
    }
  }
  return { code: 0, output }
}

function normalizeSource(src?: string): 'action' | 'webhook' | 'cli' {
function normalizeSource(src?: string): 'action' | 'webhook' | 'cli' {
  switch ((src || 'cli').toLowerCase()) {
    case 'action':
    case 'actions':
    case 'github_actions':
      return 'action'
    case 'webhook':
      return 'webhook'
    default:
      return 'cli'
  }
}

function detectType(p: AnyObj): NormalizedEvent['type'] {
  if (p.workflow_run) return 'workflow_run'
  if (p.pull_request) return 'pull_request'
  if (p.comment) return 'issue_comment'
  if (p.commits || (typeof p.ref === 'string' && (p.before || p.after))) return 'push'
  return 'alert' as any // fallback to a permitted enum to satisfy schema
}

function selectRepo(p: AnyObj) {
  const repo = p.repository || p.workflow_run?.repository || p.pull_request?.base?.repo
  return {
    id: toInt(repo?.id) ?? 0,
    name: String(repo?.name || ''),
    full_name: String(repo?.full_name || ''),
    private: Boolean(repo?.private),
    visibility: repo?.visibility ?? null
  }
}

function selectActor(p: AnyObj) {
  const a = p.sender || p.comment?.user || p.pull_request?.user
  return {
    id: toInt(a?.id) ?? 0,
    login: String(a?.login || a?.name || ''),
    type: String(a?.type || 'User')
  }
}

function buildRef(p: AnyObj, type: string) {
  if (type === 'workflow_run') {
    const wr = p.workflow_run || {}
    return {
      name: String(wr.head_branch || ''),
      type: (wr.head_branch ? 'branch' : 'unknown') as 'branch' | 'unknown',
      sha: String(wr.head_sha || '')
    }
  }
  if (type === 'pull_request') {
    const pr = p.pull_request || {}
    return {
      name: String(pr.head?.ref || ''),
      type: 'branch' as const,
      base: String(pr.base?.sha || ''),
      head: String(pr.head?.sha || '')
    }
  }
  if (type === 'push') {
    const ref: string = p.ref || ''
    const name = ref.startsWith('refs/heads/') ? ref.replace('refs/heads/', '')
      : ref.startsWith('refs/tags/') ? ref.replace('refs/tags/', '')
      : ref
    const rtype = (ref.startsWith('refs/heads/') ? 'branch' : ref.startsWith('refs/tags/') ? 'tag' : 'unknown') as 'branch' | 'tag' | 'unknown'
    return { name: String(name || ''), type: rtype, sha: String(p.after || '') }
  }
  // issue_comment and others – usually no ref
  return undefined
}

function selectOccurredAt(p: AnyObj, type: string): string | undefined {
  if (type === 'workflow_run') return p.workflow_run?.created_at || p.workflow_run?.updated_at || p.workflow_run?.completed_at
  if (type === 'pull_request') return p.pull_request?.created_at || p.pull_request?.updated_at
  if (type === 'push') return p.head_commit?.timestamp || p.commits?.[p.commits.length - 1]?.timestamp
  if (type === 'issue_comment') return p.comment?.created_at || p.comment?.updated_at
  return undefined
}

function selectEventId(p: AnyObj, type: string): string | undefined {
  if (type === 'workflow_run') return String(p.workflow_run?.id)
  if (type === 'pull_request') return String(p.pull_request?.id || p.pull_request?.number)
  if (type === 'push') return String(p.after || p.head_commit?.id)
  if (type === 'issue_comment') return String(p.comment?.id)
  return undefined
}

function toInt(v: any): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
