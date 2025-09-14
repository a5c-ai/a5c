import type { NormalizedEvent, Mention } from './types.js'
import { readJSONFile, loadConfig } from './config.js'
import { extractMentions } from './extractor.js'
import { scanPatchForCodeCommentMentions, isBinaryPatch, scanCodeCommentsForMentions } from './codeComments.js'
import { scanMentionsInCodeComments } from './utils/commentScanner.js'
import { evaluateRulesDetailed, loadRules } from './rules.js'

export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output: NormalizedEvent | Record<string, unknown> }>{
  // Require --in for enrich
  if (!opts.in) {
    return { code: 2, output: { error: 'enrich: missing --in' } }
  }
  let input: any
  try {
    input = readJSONFile<any>(opts.in) || {}
  } catch (e: any) {
    return { code: 2, output: { error: String(e?.message || e) } }
  }
  // Default to false to avoid large payloads and potential secret leakage
  const includePatch = toBool(opts.flags?.include_patch ?? false)
  const commitLimit = toInt(opts.flags?.commit_limit, 50)
  const fileLimit = toInt(opts.flags?.file_limit, 200)
  const useGithub = toBool(opts.flags?.use_github)

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
  const hasOctokit = !!opts.octokit
  const shouldEnrichGithub = useGithub || hasOctokit
  if (!shouldEnrichGithub) {
    // Offline/default mode: do not perform network enrichment
    githubEnrichment = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }
  } else if (useGithub && !token && !hasOctokit) {
    // Flag requested but no token (and no injected octokit): mark as partial and do NOT call network
    githubEnrichment = {
      provider: 'github',
      partial: true,
      reason: 'github_token_missing',
      errors: [{ message: 'GitHub token is required for enrichment' }]
    }
  } else {
    try {
      const mod: any = await import('./enrichGithubEvent.js')
      const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
      const enriched = await fn(baseEvent, { token, commitLimit, fileLimit, octokit: opts.octokit, includePatch })
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
      // Only treat as provider error when the user explicitly requested --use-github
      if (useGithub) return { code: 3, output: { error: `github enrichment failed: ${String(e?.message || e)}` } }
      // Otherwise, degrade gracefully
      githubEnrichment = { provider: 'github', partial: true, errors: [{ message: String(e?.message || e) }] }
    }
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
    // ignore mention extraction errors from optional/text fields
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
    const octokit = opts.octokit ?? (useGithub && token ? mod.createOctokit?.(token) : undefined)

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
  } catch {
    // ignore code comment scanning failures; treated as best-effort enrichment
  }

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
      // Always expose github enrichment; in offline mode it's a partial stub with reason
      github: githubEnrichment,
      metadata: { ...(neShell.enriched?.metadata || {}), rules: opts.rules },
      derived: { ...(neShell.enriched?.derived || {}), flags: opts.flags || {} },
      ...(mentions.length ? { mentions } : {})
    }
  }
  // Evaluate composed event rules (if provided)
  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      const evalObj: any = { ...output, enriched: output.enriched, labels: output.labels || [] }
      const res = evaluateRulesDetailed(evalObj, rules)
      if (res?.composed?.length) {
        // Map detailed criteria to a human-readable reason string (join with AND)
        const composed = res.composed.map((c: any) => ({
          key: c.key,
          reason: Array.isArray(c.criteria) && c.criteria.length ? c.criteria.join(' && ') : undefined,
          targets: c.targets,
          labels: c.labels,
          payload: c.payload,
        }))
        ;(output as any).composed = composed
      }
      const meta: any = (output.enriched as any).metadata || {}
      ;(output.enriched as any).metadata = { ...meta, rules_status: res.status }
    }
  } catch (e) {
    // do not fail enrichment on rules errors; record under enriched.metadata
    const meta: any = (output.enriched as any).metadata || {}
    ;(output.enriched as any).metadata = { ...meta, rules_status: { ok: false, warnings: [String((e as any)?.message || e)] } }
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
