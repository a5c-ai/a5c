import type { Mention } from './types.js'
import { extractMentions } from './extractor.js'

type Lang = 'js' | 'ts' | 'tsx' | 'jsx' | 'unknown'

export function extToLang(filename: string): Lang {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = m?.[1] || ''
  if (ext === 'js') return 'js'
  if (ext === 'ts') return 'ts'
  if (ext === 'tsx') return 'tsx'
  if (ext === 'jsx') return 'jsx'
  return 'unknown'
}

export function isBinaryPatch(patch?: string | null): boolean {
  if (!patch) return true
  // Heuristic: GitHub omits patch for binaries, or includes markers
  if (patch.includes('GIT binary patch')) return true
  return false
}

export function parseAddedLinesWithNumbers(patch: string): Array<{ line: number; text: string }> {
  const out: Array<{ line: number; text: string }> = []
  let newLine = 0
  for (const raw of patch.split(/\r?\n/)) {
    if (raw.startsWith('@@')) {
      // @@ -a,b +c,d @@ optional section
      const m = raw.match(/\+([0-9]+)(?:,([0-9]+))?/)
      newLine = m ? parseInt(m[1], 10) : 0
      continue
    }
    if (!raw) continue
    const sign = raw[0]
    const text = raw.slice(1)
    if (sign === '+') {
      out.push({ line: newLine, text })
      newLine++
    } else if (sign === ' ') {
      newLine++
    } else if (sign === '-') {
      // removed line, do not advance newLine
    } else {
      // context like \ No newline at end of file
    }
  }
  return out
}

export function isCommentLine(line: string, lang: Lang, state: { inBlock: boolean }): boolean {
  const trimmed = line.trim()
  if (lang === 'js' || lang === 'ts' || lang === 'tsx' || lang === 'jsx') {
    if (trimmed.startsWith('//')) return true
    if (trimmed.includes('/*')) state.inBlock = true
    if (state.inBlock) {
      if (trimmed.includes('*/')) state.inBlock = false
      return true
    }
  }
  return false
}

export function scanPatchForCodeCommentMentions(
  filename: string,
  patch: string,
  opts: { window?: number; knownAgents?: string[] }
): Mention[] {
  const lang = extToLang(filename)
  const added = parseAddedLinesWithNumbers(patch)
  const mentions: Mention[] = []
  const state = { inBlock: false }
  for (const { line, text } of added) {
    if (!isCommentLine(text, lang, state)) continue
    const found = extractMentions(text, 'code_comment', {
      window: opts.window ?? 30,
      knownAgents: opts.knownAgents || [],
    })
    for (const m of found) {
      m.location = `${filename}:${line}`
      // Lower confidence slightly for code comment heuristic
      m.confidence = Math.min(1, Math.max(0, m.confidence - 0.05))
      mentions.push(m)
    }
  }
  return mentions
}

