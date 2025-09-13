import type { NormalizedEvent, Mention } from './types.js'
import { readJSONFile, loadConfig } from './config.js'
import { extractMentions } from './extractor.js'
import { scanMentionsInCodeComments } from './utils/commentScanner.js'
import { evaluateRules, loadRules } from './rules.js'

export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output: NormalizedEvent }>{
  const input = readJSONFile<any>(opts.in) || {}
  // Default to false to avoid large payloads and potential secret leakage
  const includePatch = toBool(opts.flags?.include_patch ?? false)
  const commitLimit = toInt(opts.flags?.commit_limit, 50)
  const fileLimit = toInt(opts.flags?.file_limit, 200)

  const cfg = loadConfig()
  const token = cfg.githubToken

  const isNE = input && typeof input === 'object' && input.provider === 'github' && 'payload' in input
  const baseEvent = isNE ? input.payload : input

  const neShell: NormalizedEvent = isNE
    ? input
    : {
        id: String(baseEvent?.after || baseEvent?.workflow_run?.id || baseEvent?.pull_request?.id || 'temp-' + Math.random().toString(36).slice(2)),
        provider: 'github',
        type: baseEvent?.pull_request ? 'pull_request' : baseEvent?.workflow_run ? 'workflow_run' : baseEvent?.ref ? 'push' : 'commit',
        occurred_at: new Date(
          baseEvent?.head_commit?.timestamp || baseEvent?.workflow_run?.updated_at || baseEvent?.pull_request?.updated_at || Date.now()
        ).toISOString(),
        payload: baseEvent,
        labels: opts.labels || [],
        provenance: { source: 'cli' }
      }

  let githubEnrichment: any = {}
  try {
    const mod: any = await import('./enrichGithubEvent.js')
    const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
    const enriched = await fn(baseEvent, { token, commitLimit, fileLimit, octokit: opts.octokit })
    githubEnrichment = enriched?._enrichment || {}
    if (!includePatch) {
      if (githubEnrichment.pr?.files) {
        githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => ({ ...f, patch: undefined }))
      }
      if (githubEnrichment.push?.files) {
        githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => ({ ...f, patch: undefined }))
      }
    } else {
      // Ensure a defined patch key when include_patch=true so callers can rely on presence
      if (githubEnrichment.pr?.files) {
        githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => (
          Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }
        ))
      }
      if (githubEnrichment.push?.files) {
        githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => (
          Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }
        ))
      }
    }
  } catch (e: any) {
    githubEnrichment = { provider: 'github', partial: true, errors: [{ message: String(e?.message || e) }] }
  }

  // Mentions from common text locations
  const mentions: Mention[] = []
  try {
    const pr = (baseEvent as any)?.pull_request
    if (pr?.body) mentions.push(...extractMentions(String(pr.body), 'pr_body'))
    if (pr?.title) mentions.push(...extractMentions(String(pr.title), 'pr_title'))
    const commits = (baseEvent as any)?.commits
    if (Array.isArray(commits)) {
      for (const c of commits) if (c?.message) mentions.push(...extractMentions(String(c.message), 'commit_message'))
    }
    const commentBody = (baseEvent as any)?.comment?.body
    if (commentBody) mentions.push(...extractMentions(String(commentBody), 'issue_comment'))
  } catch {
    // ignore mention extraction errors from optional fields
    void 0
  }

  // Mentions from changed files (code comments)
  try {
    const scanChangedFiles = toBool((opts.flags as any)?.['mentions.scan.changed_files'] ?? true)
    const maxFileBytes = toInt((opts.flags as any)?.['mentions.max_file_bytes'], 200 * 1024)
    const langFilterRaw = (opts.flags as any)?.['mentions.languages']
    const languageFilters = typeof langFilterRaw === 'string' && langFilterRaw.length
      ? String(langFilterRaw).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    if (scanChangedFiles) {
      const files: { filename: string; patch?: string; raw_url?: string; blob_url?: string }[] = []
      const gh = githubEnrichment || {}
      const prFiles = gh?.pr?.files || []
      const pushFiles = gh?.push?.files || []
      for (const f of prFiles) files.push({ filename: f.filename, patch: f.patch, raw_url: f.raw_url, blob_url: f.blob_url })
      for (const f of pushFiles) files.push({ filename: f.filename, patch: f.patch, raw_url: f.raw_url, blob_url: f.blob_url })

      // If patch available, synthesize per-line content context; otherwise attempt to fetch raw if token provided
      for (const f of files) {
        // Prefer patch text if present, as it is already constrained in size
        const patch = typeof f.patch === 'string' ? f.patch : ''
        if (!patch) continue
        // Build a lightweight pseudo-file content from patch lines starting with '+' or ' ' to approximate context
        const lines = patch.split(/\r?\n/)
        const approxFile: string[] = []
        for (const l of lines) {
          if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@')) { approxFile.push('') ; continue }
          if (l.startsWith('+') || l.startsWith(' ') || l.startsWith('-')) {
            // include all lines to keep positions consistent; deletions still matter for mentions in comments
            approxFile.push(l.slice(1))
          } else {
            approxFile.push(l)
          }
        }
        const content = approxFile.join('\n')
        const found = scanMentionsInCodeComments({
          content,
          filename: f.filename,
          maxBytes: maxFileBytes,
          languageFilters,
          source: 'code_comment',
        })
        mentions.push(...found)
      }
    }
  } catch {
    // ignore scanning errors; do not block enrichment
    void 0
  }

  const output: NormalizedEvent = {
    ...(neShell as any),
    enriched: {
      ...(neShell.enriched || {}),
      github: githubEnrichment,
      metadata: { ...(neShell.enriched?.metadata || {}), rules: opts.rules || null },
      derived: { ...(neShell.enriched?.derived || {}), flags: opts.flags || {} },
      ...(mentions.length ? { mentions } : {})
    }
  }
  // Evaluate composed event rules (if provided)
  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      // Build evaluation object: combine NE + enriched.github for convenience
      const evalObj: any = {
        ...output,
        enriched: output.enriched,
        labels: output.labels || [],
      }
      const composed = evaluateRules(evalObj, rules).map((m) => ({ key: m.key, targets: m.targets || [], data: m.data, labels: m.labels || [] }))
      if (composed.length) (output as any).composed = composed
    }
  } catch (e) {
    // do not fail enrichment on rules errors; record under enriched.metadata
    const meta: any = (output.enriched as any).metadata || {}
    meta.rules_error = String((e as any)?.message || e)
    ;(output.enriched as any).metadata = meta
  }
  return { code: 0, output }
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (v == null) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

function toInt(v: any, d = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}
