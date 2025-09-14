import type { NormalizedEvent, Mention } from '../types.js'
import { readJSONFile, loadConfig } from '../config.js'
import { extractMentions } from '../extractor.js'
import { scanCodeCommentsForMentions, isBinaryPatch } from '../codeComments.js'
import { scanMentionsInCodeComments } from '../utils/commentScanner.js'
import { evaluateRulesDetailed, loadRules } from '../rules.js'

export async function cmdEnrich(opts: {
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
    const mod: any = await import('../providers/github/enrich.js')
    const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
    // Only call provider if explicitly requested via flags.use_github truthy
    const useGithub = toBool((opts.flags as any)?.use_github)
    const enriched = useGithub
      ? await fn(baseEvent, { token, commitLimit, fileLimit, includePatch, octokit: opts.octokit })
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

  // Mentions from code comments by scanning patch approximations
  try {
    const maxFileBytes = toInt((opts.flags as any)?.['mentions.max_file_bytes'], 200 * 1024)
    const languageFiltersRaw = (opts.flags as any)?.['mentions.languages']
    const languageFilters = Array.isArray(languageFiltersRaw)
      ? languageFiltersRaw
      : typeof languageFiltersRaw === 'string' && languageFiltersRaw.length
      ? String(languageFiltersRaw).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    const prFiles: any[] = (githubEnrichment?.pr?.files as any[]) || []
    const pushFiles: any[] = (githubEnrichment?.push?.files as any[]) || []
    const files = [...prFiles, ...pushFiles]
    for (const f of files) {
      const filename = f?.filename
      const patch: string | undefined = f?.patch
      if (!filename || !patch || isBinaryPatch(patch)) continue
      if (patch.length > maxFileBytes) continue
      if (languageFilters && !languageFilters.some((ext) => filename.toLowerCase().endsWith(`.${ext}`))) continue
      const lines = String(patch).split(/\r?\n/)
      const pseudo: string[] = []
      for (const l of lines) {
        if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@')) { pseudo.push(''); continue }
        if (l.startsWith('+') || l.startsWith(' ') || l.startsWith('-')) pseudo.push(l.slice(1))
        else pseudo.push(l)
      }
      const content = pseudo.join('\n')
      const found = scanMentionsInCodeComments({ content, filename, maxBytes: maxFileBytes, languageFilters, source: 'code_comment' })
      if (found.length) mentions.push(...found)
    }
  } catch {}

  // Fetch-and-scan mode when Octokit is available and we have ref context
  try {
    const gh = (githubEnrichment || {}) as any
    let owner: string | undefined = gh.owner
    let repo: string | undefined = gh.repo
    let filesList: any[] | undefined = gh?.pr?.files || gh?.push?.files
    let ref: string | undefined = (baseEvent as any)?.pull_request?.head?.sha || (baseEvent as any)?.pull_request?.head?.ref || (baseEvent as any)?.after || (baseEvent as any)?.head_commit?.id
    if (!owner || !repo) {
      const full = (baseEvent as any)?.repository?.full_name
      if (typeof full === 'string' && full.includes('/')) { const parts = full.split('/'); owner = parts[0]; repo = parts[1] }
    }
    const mod: any = await import('../enrichGithubEvent.js')
    const octokit = opts.octokit || mod.createOctokit?.(token)
    if ((!filesList || !Array.isArray(filesList)) && octokit && owner && repo) {
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

  // Optional: evaluate rules when provided
  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      const evalObj: any = { ...output, enriched: output.enriched, labels: output.labels || [] }
      const res = evaluateRulesDetailed(evalObj, rules)
      if (res?.composed?.length) {
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
  } catch {}
  return { code: 0, output }
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (v == null) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on'
}

function toInt(v: any, d = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}
}
import type { NormalizedEvent, Mention } from '../types.js'
import { readJSONFile, loadConfig } from '../config.js'
import { extractMentions } from '../extractor.js'
import { evaluateRulesDetailed, loadRules } from '../rules.js'
import { scanPatchForCodeCommentMentions, isBinaryPatch, scanCodeCommentsForMentions } from '../codeComments.js'
import { scanMentionsInCodeComments } from '../utils/commentScanner.js'

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
  const useGithub = toBool((opts.flags as any)?.use_github)
  if (!useGithub) {
    githubEnrichment = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }
  } else if (!token) {
    githubEnrichment = {
      provider: 'github',
      partial: true,
      reason: 'github_token_missing',
      errors: [{ message: 'GitHub token is required for enrichment' }]
    }
  } else {
    try {
      const mod: any = await import('../enrichGithubEvent.js')
      const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
      const enriched = await fn(baseEvent, { token, commitLimit, fileLimit, includePatch, octokit: opts.octokit })
      githubEnrichment = enriched?._enrichment || {}

      if (!includePatch) {
        if (githubEnrichment.pr?.files) {
          githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => ({ ...f, patch: undefined }))
        }
        if (githubEnrichment.push?.files) {
          githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => ({ ...f, patch: undefined }))
        }
      } else {
        if (githubEnrichment.pr?.files) {
          githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => (Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }))
        }
        if (githubEnrichment.push?.files) {
          githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => (Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }))
        }
      }
    } catch (e: any) {
      return { code: 3, errorMessage: `GitHub enrichment failed: ${e?.message || e}` }
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
  } catch {}

  // Mentions from code comments by scanning patch approximations
  try {
    const maxFileBytes = toInt((opts.flags as any)?.['mentions.max_file_bytes'], 200 * 1024)
    const languageFiltersRaw = (opts.flags as any)?.['mentions.languages']
    const languageFilters = Array.isArray(languageFiltersRaw)
      ? languageFiltersRaw
      : typeof languageFiltersRaw === 'string' && languageFiltersRaw.length
      ? String(languageFiltersRaw).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    const prFiles: any[] = (githubEnrichment?.pr?.files as any[]) || []
    const pushFiles: any[] = (githubEnrichment?.push?.files as any[]) || []
    const files = [...prFiles, ...pushFiles]

    for (const f of files) {
      const filename = f?.filename
      const patch: string | undefined = f?.patch
      if (!filename || !patch || isBinaryPatch(patch)) continue
      if (patch.length > maxFileBytes) continue
      if (languageFilters && !languageFilters.some((ext) => filename.toLowerCase().endsWith(`.${ext}`))) continue

      // Build a pseudo-file from the patch to scan code-comment mentions
      const lines = String(patch).split(/\r?\n/)
      const pseudo: string[] = []
      for (const l of lines) {
        if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@')) { pseudo.push(''); continue }
        if (l.startsWith('+') || l.startsWith(' ') || l.startsWith('-')) pseudo.push(l.slice(1))
        else pseudo.push(l)
      }
      const content = pseudo.join('\n')
      const found = scanMentionsInCodeComments({
        content,
        filename,
        maxBytes: maxFileBytes,
        languageFilters,
        source: 'code_comment',
      })
      if (found.length) mentions.push(...found)
    }
  } catch {}

  // Mentions by fetching file contents if Octokit and refs available
  try {
    const gh = (githubEnrichment || {}) as any
    let owner: string | undefined = gh.owner
    let repo: string | undefined = gh.repo
    let filesList: any[] | undefined = gh?.pr?.files || gh?.push?.files
    let ref: string | undefined = (baseEvent as any)?.pull_request?.head?.sha || (baseEvent as any)?.pull_request?.head?.ref || (baseEvent as any)?.after || (baseEvent as any)?.head_commit?.id

    if (!owner || !repo) {
      const full = (baseEvent as any)?.repository?.full_name
      if (typeof full === 'string' && full.includes('/')) {
        const parts = full.split('/')
        owner = parts[0]
        repo = parts[1]
      }
    }

    const mod: any = await import('../enrichGithubEvent.js')
    const octokit = opts.octokit || mod.createOctokit?.(token)

    if ((!filesList || !Array.isArray(filesList)) && octokit && owner && repo) {
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
      metadata: { ...(neShell.enriched?.metadata || {}), rules: opts.rules },
      derived: { ...(neShell.enriched?.derived || {}), flags: opts.flags || {} },
      ...(mentions.length ? { mentions } : {})
    }
  }

  // Evaluate composed rules
  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      const evalObj: any = { ...output, enriched: output.enriched, labels: output.labels || [] }
      const res = evaluateRulesDetailed(evalObj, rules)
      if (res?.composed?.length) {
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
    const meta: any = (output.enriched as any).metadata || {}
    ;(output.enriched as any).metadata = { ...meta, rules_status: { ok: false, warnings: [String((e as any)?.message || e)] } }
  }

  return { code: 0, output }
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (v == null) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on'
}

function toInt(v: any, d = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}
import type { NormalizedEvent, Mention } from '../types.js'
import { readJSONFile, loadConfig } from '../config.js'
import { extractMentions } from '../extractor.js'

=======
>>>>>>> aa42b45 (chore: sync branch before push)
// Command-layer wrapper used by the CLI. Keeps error messaging and flags semantics.
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

  // Optional provider enrichment (GitHub) behind a flag
  let githubEnrichment: any = {}
  try {
    const useGithub = toBool((opts.flags as any)?.use_github)
    if (useGithub) {
      const mod: any = await import('../enrichGithubEvent.js')
      const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
      const enriched = await fn(baseEvent, { token, commitLimit, fileLimit, includePatch, octokit: opts.octokit })
      githubEnrichment = enriched?._enrichment || {}
      if (!includePatch) {
        if (githubEnrichment.pr?.files) {
          githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => ({ ...f, patch: undefined }))
        }
        if (githubEnrichment.push?.files) {
          githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => ({ ...f, patch: undefined }))
        }
      }
    } else {
      githubEnrichment = { provider: 'github', skipped: true }
    }
  } catch (e: any) {
    // If provider was requested but failed, surface as code 3 for CLI
    const useGithub = toBool((opts.flags as any)?.use_github)
    if (useGithub) return { code: 3, errorMessage: `GitHub enrichment failed: ${e?.message || e}` }
    githubEnrichment = { provider: 'github', partial: true, errors: [{ message: String(e?.message || e) }] }
  }

  // Best-effort mentions from common text fields
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

  // Mentions from code comments by scanning patch approximations
  try {
    const maxFileBytes = toInt((opts.flags as any)?.['mentions.max_file_bytes'], 200 * 1024)
    const languageFiltersRaw = (opts.flags as any)?.['mentions.languages']
    const languageFilters = Array.isArray(languageFiltersRaw)
      ? languageFiltersRaw
      : typeof languageFiltersRaw === 'string' && languageFiltersRaw.length
      ? String(languageFiltersRaw).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    const prFiles: any[] = (githubEnrichment?.pr?.files as any[]) || []
    const pushFiles: any[] = (githubEnrichment?.push?.files as any[]) || []
    const files = [...prFiles, ...pushFiles]
    for (const f of files) {
      const filename = f?.filename
      const patch: string | undefined = f?.patch
      if (!filename || !patch || isBinaryPatch(patch)) continue
      if (patch.length > maxFileBytes) continue
      if (languageFilters && !languageFilters.some((ext) => filename.toLowerCase().endsWith(`.${ext}`))) continue
      const lines = String(patch).split(/\r?\n/)
      const pseudo: string[] = []
      for (const l of lines) {
        if (l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@')) { pseudo.push(''); continue }
        if (l.startsWith('+') || l.startsWith(' ') || l.startsWith('-')) pseudo.push(l.slice(1))
        else pseudo.push(l)
      }
      const content = pseudo.join('\n')
      const found = scanMentionsInCodeComments({ content, filename, maxBytes: maxFileBytes, languageFilters, source: 'code_comment' })
      if (found.length) mentions.push(...found)
    }
  } catch {}

  // Mentions by fetching file contents if Octokit and refs available
  try {
    const gh = (githubEnrichment || {}) as any
    let owner: string | undefined = gh.owner
    let repo: string | undefined = gh.repo
    let filesList: any[] | undefined = gh?.pr?.files || gh?.push?.files
    let ref: string | undefined = (baseEvent as any)?.pull_request?.head?.sha || (baseEvent as any)?.pull_request?.head?.ref || (baseEvent as any)?.after || (baseEvent as any)?.head_commit?.id

    if (!owner || !repo) {
      const full = (baseEvent as any)?.repository?.full_name
      if (typeof full === 'string' && full.includes('/')) { const parts = full.split('/'); owner = parts[0]; repo = parts[1] }
    }

    const mod: any = await import('../enrichGithubEvent.js')
    const octokit = opts.octokit || mod.createOctokit?.(token)

    if ((!filesList || !Array.isArray(filesList)) && octokit && owner && repo) {
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

  // Optional: evaluate rules when provided
  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      const evalObj: any = { ...output, enriched: output.enriched, labels: output.labels || [] }
      const res = evaluateRulesDetailed(evalObj, rules)
      if (res?.composed?.length) {
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
  } catch {}

  return { code: 0, output }
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (v == null) return false
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on'
}

function toInt(v: any, d = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

<<<<<<< HEAD
export default cmdEnrich
=======
>>>>>>> aa42b45 (chore: sync branch before push)
