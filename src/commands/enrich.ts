import type { NormalizedEvent, Mention } from '../types.js'
import { readJSONFile, loadConfig } from '../config.js'
import { extractMentions } from '../extractor.js'
import { normalizeGithub } from '../providers/github/normalize.js'

export async function cmdEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }>{
  if (!opts.in) return { code: 2, errorMessage: 'Missing required --in FILE' }
  let input: any
  try {
    input = readJSONFile<any>(opts.in) || {}
  } catch (e: any) {
    const msg = e?.code === 'ENOENT' ? `Input file not found: ${e?.path || opts.in}` : `Invalid JSON or read error: ${e?.message || e}`
    return { code: 2, errorMessage: msg }
  }
  const includePatch = toBool(opts.flags?.include_patch ?? true)
  const commitLimit = toInt(opts.flags?.commit_limit, 50)
  const fileLimit = toInt(opts.flags?.file_limit, 200)

  const cfg = loadConfig()
  const token = cfg.githubToken

  const isNE = input && typeof input === 'object' && input.provider === 'github' && 'payload' in input
  const baseEvent = isNE ? input.payload : input

  // Build a complete NE shell so schema validation can pass (repo, actor, ref)
  const neShell: NormalizedEvent = isNE
    ? (input as NormalizedEvent)
    : normalizeGithub(baseEvent, { source: 'cli', labels: opts.labels || [] })

  let githubEnrichment: any = {}
  try {
    const mod: any = await import('../enrichGithubEvent.js')
    const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
    // Only call provider if explicitly requested via flags.use_github truthy
    const useGithub = toBool((opts.flags as any)?.use_github)
    const enriched = useGithub
      ? await fn(baseEvent, { token, commitLimit, fileLimit, octokit: opts.octokit })
      : { _enrichment: { provider: 'github', partial: true, reason: 'github_enrich_disabled' } }
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
    // If provider was requested but failed, return provider error code 3
    const useGithub = toBool((opts.flags as any)?.use_github)
    if (useGithub) {
      return { code: 3, errorMessage: `GitHub enrichment failed: ${e?.message || e}` }
    }
    githubEnrichment = { provider: 'github', partial: true, errors: [{ message: String(e?.message || e) }] }
  }

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
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on'
}

function toInt(v: any, def = 0): number {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : def
}
