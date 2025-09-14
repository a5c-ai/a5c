import type { NormalizedEvent, Mention } from './types.js'
import { readJSONFile, loadConfig } from './config.js'
import { extractMentions } from './extractor.js'
import { scanCodeCommentsForMentions, isBinaryPatch, scanPatchForCodeCommentMentions } from './codeComments.js'
import { evaluateRulesDetailed, loadRules } from './rules.js'
import { normalizeGithub } from './providers/github/normalize.js'

function toBool(v: any): boolean { if (typeof v === 'boolean') return v; if (v == null) return false; const s = String(v).toLowerCase(); return s === '1' || s === 'true' || s === 'yes' || s === 'on' }
function toInt(v: any, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d }

export async function handleEnrich(opts: {
  in?: string
  labels?: string[]
  rules?: string
  flags?: Record<string, string | boolean | number>
  octokit?: any
}): Promise<{ code: number; output: NormalizedEvent | Record<string, unknown> }>{
  if (!opts.in) return { code: 2, output: { error: 'enrich: missing --in' } }

  let input: any
  try {
    input = readJSONFile<any>(opts.in) || {}
  } catch (e: any) {
    return { code: 2, output: { error: e?.code === 'ENOENT' ? `Input file not found: ${e?.path || opts.in}` : String(e?.message || e) } }
  }

  const includePatch = toBool(opts.flags?.include_patch ?? false)
  const commitLimit = toInt(opts.flags?.commit_limit, 50)
  const fileLimit = toInt(opts.flags?.file_limit, 200)
  const useGithub = toBool(opts.flags?.use_github)

  const cfg = loadConfig()
  const token = cfg.githubToken

  const isNE = input && typeof input === 'object' && input.provider === 'github' && 'payload' in input
  const baseEvent = isNE ? (input as any).payload : input

  const neShell: NormalizedEvent = isNE
    ? (input as NormalizedEvent)
    : normalizeGithub(baseEvent, { source: 'cli', labels: opts.labels || [] })

  let githubEnrichment: any = {}
  try {
    if (!useGithub) {
      githubEnrichment = { provider: 'github', partial: true, reason: 'github_enrich_disabled' }
    } else if (!token && !opts.octokit) {
      githubEnrichment = { provider: 'github', skipped: true, reason: 'token:missing' }
    } else {
      const mod: any = await import('./enrichGithubEvent.js')
      const fn = (mod.enrichGithubEvent || mod.default) as (e: any, o?: any) => Promise<any>
      const enriched = await fn(baseEvent, { token, commitLimit, fileLimit, octokit: opts.octokit, includePatch })
      githubEnrichment = enriched?._enrichment || {}

      // Compute owners_union for PR (issue #249)
      if (githubEnrichment?.pr?.owners && !githubEnrichment?.pr?.owners_union) {
        const set = new Set<string>()
        try {
          const ownersMap = githubEnrichment.pr.owners as Record<string, string[]>
          for (const k of Object.keys(ownersMap || {})) for (const o of ownersMap[k] || []) set.add(o)
        } catch {}
        githubEnrichment.pr.owners_union = Array.from(set).sort((a, b) => a.localeCompare(b))
      }
    }

    // Fallback: when offline/partial, project basic PR fields from payload so rules can work
    try {
      const prPayload = (baseEvent as any)?.pull_request
      if (prPayload && (!githubEnrichment || typeof githubEnrichment !== 'object')) githubEnrichment = {}
      if (prPayload) {
        githubEnrichment.pr = { ...(githubEnrichment.pr || {}) }
        if (githubEnrichment.pr.number == null && prPayload.number != null) githubEnrichment.pr.number = prPayload.number
        if (githubEnrichment.pr.draft == null && typeof prPayload.draft === 'boolean') githubEnrichment.pr.draft = prPayload.draft
        if (githubEnrichment.pr.mergeable_state == null && prPayload.mergeable_state != null) githubEnrichment.pr.mergeable_state = prPayload.mergeable_state
      }
    } catch {}

    if (!includePatch) {
      if (githubEnrichment.pr?.files) githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => ({ ...f, patch: undefined }))
      if (githubEnrichment.push?.files) githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => ({ ...f, patch: undefined }))
    } else {
      if (githubEnrichment.pr?.files) githubEnrichment.pr.files = githubEnrichment.pr.files.map((f: any) => (Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }))
      if (githubEnrichment.push?.files) githubEnrichment.push.files = githubEnrichment.push.files.map((f: any) => (Object.prototype.hasOwnProperty.call(f, 'patch') ? f : { ...f, patch: '' }))
    }
  } catch (e: any) {
    const errMessage = String(e?.message || e)
    githubEnrichment = { provider: 'github', partial: true, errors: [{ message: errMessage }] }
  }

  const mentions: Mention[] = []
  try {
    const pr = (baseEvent as any)?.pull_request
    if (pr?.body) mentions.push(...extractMentions(String(pr.body), 'pr_body'))
    if (pr?.title) mentions.push(...extractMentions(String(pr.title), 'pr_title'))
    const commits = (baseEvent as any)?.commits
    if (Array.isArray(commits)) for (const c of commits) if (c?.message) mentions.push(...extractMentions(String(c.message), 'commit_message'))
    const commentBody = (baseEvent as any)?.comment?.body
    if (commentBody) mentions.push(...extractMentions(String(commentBody), 'issue_comment'))
  } catch {}

  // Best-effort code comments mentions using API when available
  try {
    let owner: string | undefined = githubEnrichment?.owner
    let repo: string | undefined = githubEnrichment?.repo
    if (!owner || !repo) {
      const full = (baseEvent as any)?.repository?.full_name as string | undefined
      if (full && full.includes('/')) [owner, repo] = full.split('/')
    }
    let files: { filename: string }[] = []
    const prFiles: any[] = githubEnrichment?.pr?.files || []
    const pushFiles: any[] = githubEnrichment?.push?.files || []
    files = (prFiles.length ? prFiles : pushFiles).map((f: any) => ({ filename: f.filename }))
    let ref = githubEnrichment?.pr?.head || githubEnrichment?.push?.after || (baseEvent as any)?.after || (neShell as any)?.ref?.sha || 'HEAD'

    if (owner && repo && !files.length && opts.octokit) {
      try {
        if ((baseEvent as any)?.pull_request?.number) {
          const number = (baseEvent as any).pull_request.number
          const list = await opts.octokit.paginate(opts.octokit.pulls.listFiles, { owner, repo, pull_number: number, per_page: 100 })
          files = (Array.isArray(list) ? list : []).map((f: any) => ({ filename: f.filename }))
          ref = (baseEvent as any)?.pull_request?.head?.sha || ref
        } else if ((baseEvent as any)?.before && (baseEvent as any)?.after) {
          const comp = await opts.octokit.repos.compareCommits({ owner, repo, base: (baseEvent as any).before, head: (baseEvent as any).after })
          const fl = ((comp?.data as any)?.files as any[]) || []
          files = fl.map((f: any) => ({ filename: f.filename }))
          ref = (baseEvent as any).after || ref
        }
      } catch {}
    }

    if (owner && repo && files.length && opts.octokit) {
      const found = await scanCodeCommentsForMentions({ owner, repo, ref, files, octokit: opts.octokit, options: { languageFilters: ['js','ts','md'] } })
      if (found.length) mentions.push(...found)
      else {
        for (const f of files) {
          try {
            const res = await opts.octokit.repos.getContent({ owner, repo, path: f.filename, ref })
            if (Array.isArray(res.data)) continue
            const encoding = (res.data as any).encoding || 'base64'
            const content: string = Buffer.from((res.data as any).content || '', encoding).toString('utf8')
            const ms = extractMentions(content, 'code_comment', { window: 30, knownAgents: [] })
            for (const m of ms) mentions.push({ ...m, location: `${f.filename}:1` } as any)
          } catch {}
        }
      }
    } catch {
      // ignore code comment scanning failures; treated as best-effort enrichment
    }
  }
    }
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

  try {
    const rules = loadRules(opts.rules)
    if (rules.length) {
      const evalObj: any = { ...output, enriched: output.enriched, labels: output.labels || [] }
      const res = evaluateRulesDetailed(evalObj, rules)
      if (res?.composed?.length) {
        const composed = res.composed.map((c: any) => ({ key: c.key, reason: Array.isArray(c.criteria) && c.criteria.length ? c.criteria.join(' && ') : undefined, targets: c.targets, labels: c.labels, payload: c.payload }))
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
