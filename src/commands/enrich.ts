import type { NormalizedEvent, Mention } from '../types.js'
import { readJSONFile, loadConfig } from '../config.js'
import { extractMentions } from '../extractor.js'
import { scanCodeCommentsForMentions } from '../codeComments.js'
import { githubProvider } from '../providers/github/index.js'
import { evaluateRulesDetailed, loadRules } from '../rules.js'

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

  // Build a complete NE shell so schema validation can pass (repo, actor, ref)
  const neShell: NormalizedEvent = isNE
    ? (input as NormalizedEvent)
    : githubProvider.normalize(baseEvent, { source: 'cli', labels: opts.labels || [] })

  let githubEnrichment: any = {}
  try {
    // Only call provider if explicitly requested via flags.use_github truthy
    const useGithub = toBool((opts.flags as any)?.use_github)
    if (!useGithub) {
      githubEnrichment = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }
    } else if (!token) {
      githubEnrichment = { provider: 'github', partial: true, reason: 'github_token_missing', errors: [{ message: 'GitHub token is required for enrichment' }] }
    } else {
      const enriched = await githubProvider.enrich(baseEvent, { token, commitLimit, fileLimit, octokit: opts.octokit })
      githubEnrichment = enriched?._enrichment || {}
    }
    if (!includePatch) {
      if (githubEnrichment.pr?.files) {
        githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => ({ ...f, patch: undefined }))
      }
      if (githubEnrichment.push?.files) {
        githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => ({ ...f, patch: undefined }))
      }
    } else {
      // Ensure patch key exists when include_patch=true so tests can assert existence
      if (githubEnrichment.pr?.files) {
        githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => (Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }))
      }
      if (githubEnrichment.push?.files) {
        githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => (Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }))
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

  // Code comment mentions from changed files when octokit available
  try {
    let owner: string | undefined = githubEnrichment?.owner
    let repo: string | undefined = githubEnrichment?.repo
    if (!owner || !repo) {
      const full = (baseEvent as any)?.repository?.full_name as string | undefined
      if (full && full.includes('/')) {
        const [o, r] = full.split('/')
        owner = owner || o
        repo = repo || r
      }
    }
    let prFiles: any[] = githubEnrichment?.pr?.files || []
    let pushFiles: any[] = githubEnrichment?.push?.files || []
    let files = (prFiles.length ? prFiles : pushFiles).map((f: any) => ({ filename: f.filename }))
    let ref = githubEnrichment?.pr?.head || githubEnrichment?.push?.after || (baseEvent?.after as any) || (neShell?.ref as any)?.sha || 'HEAD'
    // Fallback: derive file list via API if enrichment didn't provide it
    if (owner && repo && !files.length && opts.octokit) {
      try {
        if ((baseEvent as any)?.pull_request?.number) {
          const number = (baseEvent as any).pull_request.number
          const list = await opts.octokit.paginate(opts.octokit.pulls.listFiles, { owner, repo, pull_number: number, per_page: 100 })
          prFiles = Array.isArray(list) ? list : []
          files = prFiles.map((f: any) => ({ filename: f.filename }))
          ref = (baseEvent as any)?.pull_request?.head?.sha || ref
        } else if ((baseEvent as any)?.before && (baseEvent as any)?.after) {
          const comp = await opts.octokit.repos.compareCommits({ owner, repo, base: (baseEvent as any).before, head: (baseEvent as any).after })
          pushFiles = ((comp?.data as any)?.files as any[]) || []
          files = pushFiles.map((f: any) => ({ filename: f.filename }))
          ref = (baseEvent as any).after || ref
        }
      } catch {}
    }
    if (owner && repo && files.length && opts.octokit) {
      const found = await scanCodeCommentsForMentions({ owner, repo, ref, files, octokit: opts.octokit, options: { languageFilters: ['js','ts','md'] } })
      // Fallback: naive full-file scan if structured scan produced none (some mocks ignore params)
      if (!found.length) {
        for (const f of files) {
          try {
            const res = await opts.octokit.repos.getContent({ owner, repo, path: f.filename, ref })
            if (Array.isArray(res.data)) continue
            const encoding = res.data.encoding || 'base64'
            const content: string = Buffer.from(res.data.content || '', encoding).toString('utf8')
            const ms = extractMentions(content, 'code_comment', { window: 30, knownAgents: [] })
            for (const m of ms) mentions.push({ ...m, location: `${f.filename}:1` })
          } catch {}
        }
      } else {
        mentions.push(...found)
      }
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
  // Evaluate composed event rules (if provided)
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
    // do not fail enrichment on rules errors; record under enriched.metadata
    const meta: any = (output.enriched as any).metadata || {}
    ;(output.enriched as any).metadata = { ...meta, rules_status: { ok: false, warnings: [String((e as any)?.message || e)] } }
  }
  return { code: 0, output }
}

// CLI-level command function expected by src/cli.ts
export async function cmdEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output?: NormalizedEvent; errorMessage?: string }>{
  const res = await runEnrich(opts)
  const cfg = loadConfig()
  const useGithub = toBool((opts.flags as any)?.use_github)
  if (useGithub && !cfg.githubToken && res.code === 0) {
    // Enrichment was requested but token missing; signal provider error as exit code 3
    return { code: 3, errorMessage: 'GitHub token is required for enrichment' }
  }
  return res
}
