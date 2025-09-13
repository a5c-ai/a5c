import type { NormalizedEvent, Mention } from './types.js'
import { readJSONFile, loadConfig } from './config.js'
import { extractMentions } from './extractor.js'
import { scanPatchForCodeCommentMentions, isBinaryPatch } from './codeComments.js'
import type { ExtractorOptions, MentionSource } from './types.js'

export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output: NormalizedEvent }>{
  const input = readJSONFile<any>(opts.in) || {}
  const includePatch = toBool(opts.flags?.include_patch ?? true)
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
  } catch {}

  // Optional: scan changed files for code comment mentions
  try {
    const flags = opts.flags || {}
    const scanChanged = toBool((flags as any)['mentions.scan.changed_files'] ?? true)
    if (scanChanged) {
      const maxBytes = toInt((flags as any)['mentions.max_file_bytes'], 200 * 1024)
      const langAllowRaw = (flags as any)['mentions.languages']
      const langAllow = Array.isArray(langAllowRaw)
        ? langAllowRaw
        : typeof langAllowRaw === 'string' && langAllowRaw.length
        ? String(langAllowRaw).split(',').map((s) => s.trim()).filter(Boolean)
        : undefined

      const files: any[] = (
        (githubEnrichment?.pr?.files as any[]) || (githubEnrichment?.push?.files as any[]) || []
      )
      for (const f of files) {
        const filename = f?.filename
        const patch = f?.patch as string | undefined
        if (!filename || isBinaryPatch(patch)) continue
        const size = (patch || '').length
        if (size > maxBytes) continue
        if (langAllow && !langAllow.some((ext) => filename.toLowerCase().endsWith(`.${ext}`))) continue
        const found = scanPatchForCodeCommentMentions(filename, patch!, { window: 30 })
        if (found.length) mentions.push(...found)
      }
    }
  } catch {}

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
