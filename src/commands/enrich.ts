import type { NormalizedEvent, Mention } from '../types.js'
import { readJSONFile, loadConfig } from '../config.js'
import { extractMentions } from '../extractor.js'
import { githubProvider } from '../providers/github/index.js'
import { loadRules, evaluateRules } from '../rules.js'

function toBool(v: any): boolean { if (typeof v === 'boolean') return v; if (v == null) return false; const s = String(v).toLowerCase(); return s === '1' || s === 'true' || s === 'yes' || s === 'on' }
function toInt(v: any, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d }

export async function runEnrich(opts: {
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
  // Default include_patch to false to minimize payload size
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
    // Only call provider if explicitly requested via flags.use_github truthy
    const useGithub = toBool((opts.flags as any)?.use_github)
    const enriched = useGithub
      ? await githubProvider.enrich(baseEvent, { token, commitLimit, fileLimit, octokit: opts.octokit })
      : { _enrichment: { provider: 'github', skipped: true } }
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
      metadata: { ...(neShell.enriched?.metadata || {}), rules: opts.rules },
      derived: { ...(neShell.enriched?.derived || {}), flags: opts.flags || {} },
      ...(mentions.length ? { mentions } : {})
    }
  }

  // Evaluate rules, if provided
  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      const composed = evaluateRules(output as any, rules)
      ;(output as any).composed = composed
    }
  } catch {}
  return { code: 0, output }
}

// CLI-level command function expected by src/cli.ts
export const cmdEnrich = runEnrich
