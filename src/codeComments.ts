import type { Mention, ExtractorOptions } from './types.js';
import { extractMentions, dedupeMentions } from './extractor.js';

type Octokit = any;

export interface ScanOptions extends ExtractorOptions {
  fileSizeCapBytes?: number; // default 200KB
  languageFilters?: string[]; // e.g., ['js','ts','md']
}

export interface FileRef {
  filename: string;
}

export async function scanCodeCommentsForMentions(params: {
  owner: string;
  repo: string;
  ref: string; // commit SHA or branch name
  files: FileRef[];
  octokit: Octokit;
  options?: ScanOptions;
}): Promise<Mention[]> {
  const { owner, repo, ref, files, octokit } = params;
  const options = params.options || {};
  const cap = options.fileSizeCapBytes ?? 200 * 1024;
  const langFilters = options.languageFilters?.map((s) => s.toLowerCase());

  const out: Mention[] = [];
  for (const f of files) {
    const path = f.filename;
    const lang = detectLanguage(path);
    if (langFilters && lang && !langFilters.includes(lang)) continue;
    if (!lang) continue; // not supported

    try {
      const res = await octokit.repos.getContent({ owner, repo, path, ref });
      if (Array.isArray(res.data)) continue; // directory
      const size = res.data.size ?? 0;
      if (cap > 0 && size > cap) continue; // skip large file
      const encoding = res.data.encoding || 'base64';
      const content: string = Buffer.from(res.data.content || '', encoding).toString('utf8');
      const mentions = scanContentForMentions(content, path, lang, options);
      out.push(...mentions);
    } catch (_) {
      // ignore fetch errors per-file
    }
  }
  return dedupeMentions(out);
}

function detectLanguage(filename: string): 'js' | 'md' | 'ts' | null {
  const lower = filename.toLowerCase();
  if (/(\.m?jsx?|\.cjs|\.mjs)$/.test(lower)) return 'js';
  if (/(\.tsx?|\.d\.ts)$/.test(lower)) return 'ts';
  if (/(\.md|\.markdown)$/.test(lower)) return 'md';
  return null;
}

function scanContentForMentions(
  content: string,
  path: string,
  lang: 'js' | 'ts' | 'md',
  options: ExtractorOptions
): Mention[] {
  switch (lang) {
    case 'js':
    case 'ts':
      return scanJsLike(content, path, options);
    case 'md':
      return scanMarkdown(content, path, options);
  }
}

function scanMarkdown(content: string, path: string, options: ExtractorOptions): Mention[] {
  const out: Mention[] = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i];
    const found = extractMentions(line, 'code_comment', options);
    for (const m of found) out.push({ ...m, location: `${path}:${lineNo}` });
  }
  return out;
}

// Simple regex-based JS/TS comments extraction
function scanJsLike(content: string, path: string, options: ExtractorOptions): Mention[] {
  const out: Mention[] = [];

  // Block comments
  const blockRe = /\/\*[\s\S]*?\*\//g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(content))) {
    const snippet = m[0];
    const startIdx = m.index;
    // Mentions within this block
    const mentions = extractMentions(snippet, 'code_comment', options);
    for (const mm of mentions) {
      // Compute absolute index of this mention within file by searching in snippet
      const relIdx = snippet.indexOf(mm.target.startsWith('@') ? mm.target : '@' + mm.target);
      const absIdx = relIdx >= 0 ? startIdx + relIdx : startIdx;
      const lineNo = 1 + countNewlines(content, absIdx);
      out.push({ ...mm, location: `${path}:${lineNo}` });
    }
  }

  // Line comments
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf('//');
    if (idx >= 0) {
      const comment = line.slice(idx);
      const found = extractMentions(comment, 'code_comment', options);
      for (const mm of found) out.push({ ...mm, location: `${path}:${i + 1}` });
    }
  }
  return out;
}

function countNewlines(text: string, endExclusive: number): number {
  let count = 0;
  for (let i = 0; i < endExclusive; i++) if (text.charCodeAt(i) === 10) count++;
  return count;
}

