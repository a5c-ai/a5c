import { NormalizedEvent, Mention } from './types.js'
import { readJSONFile, loadConfig } from './config.js'
import { extractMentions } from './extractor.js'

type AnyObj = Record<string, any>

export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean>
}): Promise<{ code: number; output: NormalizedEvent }>{
  const input = (readJSONFile<NormalizedEvent | AnyObj>(opts.in) || {}) as any
  const input = (readJSONFile<NormalizedEvent | AnyObj>(opts.in) || {}) as any
  // Accept either already-normalized NE or raw payload; if raw, wrap minimal
  const isNE = typeof input?.provider === 'string' && typeof input?.type === 'string'
  const ne: NormalizedEvent = isNE
    ? (input as NormalizedEvent)
    : {
        id: 'temp-' + Math.random().toString(36).slice(2),
        provider: 'github',
        type: 'alert',
        occurred_at: new Date().toISOString(),
        payload: input,
        labels: opts.labels || [],
        provenance: { source: 'cli' }
      }

  const enriched: Record<string, any> = ne.enriched ? { ...ne.enriched } : {}
  // Attach rules and flags echo for traceability
  enriched.metadata = { ...(enriched.metadata || {}), rules: opts.rules || null }
  enriched.derived = { ...(enriched.derived || {}), flags: opts.flags || {} }

  // Mentions extraction from available text sources
  const mentionItems: Mention[] = []
  try {
    // Pull Request text
    const pr = (ne.payload as AnyObj)?.pull_request
    if (pr?.body) mentionItems.push(...extractMentions(String(pr.body), 'pr_body'))
    if (pr?.title) mentionItems.push(...extractMentions(String(pr.title), 'pr_title'))
    // Push commit messages
    const commits = (ne.payload as AnyObj)?.commits
    if (Array.isArray(commits)) {
      for (const c of commits) {
        if (c?.message) mentionItems.push(...extractMentions(String(c.message), 'commit_message'))
      }
    }
    // Issue comment
    const commentBody = (ne.payload as AnyObj)?.comment?.body
    if (commentBody) mentionItems.push(...extractMentions(String(commentBody), 'issue_comment'))
  } catch (e) {
    // swallow mention extraction errors; do not fail enrichment
  }
  if (mentionItems.length) enriched.mentions = mentionItems

  // Optional GitHub enrichment
  const useGithub = truthyFlag(opts.flags?.use_github || opts.flags?.useGithub)
  if (useGithub) {
    const { githubToken } = loadConfig()
    if (!githubToken) {
      // record partial enrichment due to missing token
      enriched.github = { _error: 'GITHUB_TOKEN missing', partial: true }
    } else {
      try {
        // @ts-ignore dynamic import of JS module without typings
        const mod = await import('./enrichGithubEvent.js')
        const gh = await (mod.default as any)((ne.payload as AnyObj) || {}, { token: githubToken })
        enriched.github = gh?._enrichment || gh
      } catch (e: any) {
        enriched.github = { _error: e?.message || 'github enrichment failed', partial: true }
      }
    }
  }

  const output: NormalizedEvent = { ...ne, enriched }
  return { code: 0, output }
}

function truthyFlag(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
  return false
}
