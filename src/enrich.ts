import type { NormalizedEvent, Mention } from './types.js'
import { readJSONFile, loadConfig } from './config.js'
import { extractMentions } from './extractor.js'
import { scanCodeCommentsForMentions } from './codeComments.js'

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

  // Mentions from code comments in changed files (PR/push)
  try {
    const gh = (githubEnrichment || {}) as any
    let owner: string | undefined = gh.owner
    let repo: string | undefined = gh.repo
    let filesList: any[] | undefined = gh?.pr?.files || gh?.push?.files
    let ref: string | undefined = (baseEvent as any)?.pull_request?.head?.sha || (baseEvent as any)?.pull_request?.head?.ref || (baseEvent as any)?.after || (baseEvent as any)?.head_commit?.id

    // Fallback to payload if enrichment missing
    if (!owner || !repo) {
      const full = (baseEvent as any)?.repository?.full_name
      if (typeof full === 'string' && full.includes('/')) {
        const parts = full.split('/')
        owner = parts[0]
        repo = parts[1]
      }
    }

    const mod: any = await import('./enrichGithubEvent.js')
    const octokit = opts.octokit || mod.createOctokit?.(token)

    if ((!filesList || !Array.isArray(filesList)) && octokit && owner && repo) {
      // Derive changed files using GitHub API if possible
      if ((baseEvent as any)?.pull_request?.number) {
        try {
          const number = (baseEvent as any).pull_request.number
          const list = await octokit.paginate(octokit.pulls.listFiles, { owner, repo, pull_number: number, per_page: 100 })
          filesList = Array.isArray(list) ? list : []
        } catch {}
      } else if ((baseEvent as any)?.before && (baseEvent as any)?.after) {
        try {
          const comp = await octokit.repos.compareCommits({ owner, repo, base: (baseEvent as any).before, head: (baseEvent as any).after })
          filesList = (comp?.data?.files as any[]) || []
          ref = (baseEvent as any).after
        } catch {}
      }
    }

    if (owner && repo && Array.isArray(filesList) && filesList.length && ref && octokit) {
      const files = filesList.map((f: any) => ({ filename: f.filename }))
      const codeMentions = await scanCodeCommentsForMentions({ owner, repo, ref, files, octokit, options: { fileSizeCapBytes: 200 * 1024, languageFilters: ['js','ts','md'] } })
      if (codeMentions.length) mentions.push(...codeMentions)
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
