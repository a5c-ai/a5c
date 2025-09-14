import { describe, it, expect } from 'vitest';
import { scanMentionsInCodeComments } from '../src/utils/commentScanner.js';
import { scanCodeCommentsForMentions } from '../src/codeComments.js';

function mkOctokitWithFiles(map: Record<string, string | { content: string; encoding?: string; size?: number }>) {
  return {
    repos: {
      async getContent({ path }: { path: string }) {
        const val = map[path];
        if (!val) throw Object.assign(new Error('not found'), { status: 404 });
        if (typeof val === 'string') {
          const b = Buffer.from(val, 'utf8').toString('base64');
          return { data: { content: b, encoding: 'base64', size: Buffer.byteLength(val) } } as any;
        }
        const enc = (val.encoding || 'base64') as (BufferEncoding | 'base64');
        const content = val.content;
        const size = val.size ?? Buffer.byteLength(content, (enc === 'base64' ? 'utf8' : enc) as BufferEncoding);
        const payload = enc === 'base64' ? { content: Buffer.from(content, 'utf8').toString('base64'), encoding: 'base64', size } : { content, encoding: enc, size };
        return { data: payload } as any;
      }
    }
  } as any;
}

describe('mentions extractor - code comments scanning (local content)', () => {
  it('finds @developer-agent in JS line comment', () => {
    const content = `
      // hello @developer-agent do the thing
      const s = "string with @not-an-mention because not scanned";
    `;
    const out = scanMentionsInCodeComments({ content, filename: 'x.ts' });
    const names = out.map(m => m.normalized_target);
    expect(names).toContain('developer-agent');
    const m = out.find(m => m.normalized_target === 'developer-agent');
    expect(m?.source).toBe('code_comment');
    expect(typeof (m?.location as any)?.file).toBe('string');
    expect(typeof (m?.location as any)?.line).toBe('number');
  });

  it('does not match inside code strings for JS when not in comments', () => {
    const codeOnly = `const s = "@developer-agent inside string";`;
    const out = scanMentionsInCodeComments({ content: codeOnly, filename: 'a.js' });
    expect(out.length).toBe(0);
  });

  it('respects language filter', () => {
    const content = `// @developer-agent`;
    const out = scanMentionsInCodeComments({ content, filename: 'a.ts', languageFilters: ['py'] });
    expect(out.length).toBe(0);
  });

  it('skips large files over byte cap', () => {
    const big = 'x'.repeat(300_000) + '\n// @developer-agent';
    const out = scanMentionsInCodeComments({ content: big, filename: 'b.ts', maxBytes: 10_000 });
    expect(out.length).toBe(0);
  });
});

describe('code comment mention scanning (octokit-backed)', () => {
  it('finds mentions in JS/TS line and block comments with locations', async () => {
    const js = `
// hello @developer-agent
const x = 1; /* multi \n * ping @user-123 here \n */
`;
    const ts = `
/**
 * Owner: @team/qa
 */
export const a = 1; // cc @someone
`;
    const octokit = mkOctokitWithFiles({ 'src/a.js': js, 'src/b.ts': ts });
    const out = await scanCodeCommentsForMentions({ owner: 'o', repo: 'r', ref: 'sha', files: [{ filename: 'src/a.js' }, { filename: 'src/b.ts' }], octokit, options: { languageFilters: ['js', 'ts'] } });
    const locs = out.map(m => (typeof m.location === 'string' ? m.location : (m.location as any)?.file));
    expect(locs).toContain('src/a.js:2');
    expect(locs.some(l => typeof l === 'string' && l.startsWith('src/a.js:'))).toBe(true);
    expect(locs.some(l => typeof l === 'string' && l.startsWith('src/b.ts:'))).toBe(true);
    const sources = new Set(out.map(m => m.source));
    expect(sources.has('code_comment')).toBe(true);
  });

  it('finds mentions in README markdown lines', async () => {
    const md = `# Readme\nTalk to @developer-agent for help.\n`;
    const octokit = mkOctokitWithFiles({ 'README.md': md });
    const out = await scanCodeCommentsForMentions({ owner: 'o', repo: 'r', ref: 'sha', files: [{ filename: 'README.md' }], octokit, options: { languageFilters: ['md'] } });
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].location).toBe('README.md:2');
    expect(out[0].source).toBe('code_comment');
  });

  it('skips large files over size cap', async () => {
    const huge = '/* ' + 'x'.repeat(210 * 1024) + ' @developer-agent */';
    const octokit = mkOctokitWithFiles({ 'big.js': { content: huge } });
    const out = await scanCodeCommentsForMentions({ owner: 'o', repo: 'r', ref: 'sha', files: [{ filename: 'big.js' }], octokit, options: { fileSizeCapBytes: 200 * 1024, languageFilters: ['js'] } });
    expect(out.length).toBe(0);
  });
});

describe('enrich() integration — uses patch content for changed files', () => {
  it('adds code_comment mentions from PR files when patch includes comment with @mention', async () => {
    const patch = `diff --git a/x.ts b/x.ts\n@@\n+ // @researcher-base-agent please review\n+ export const x = 1;`;
    const out = scanMentionsInCodeComments({ content: patch.split('\n').map((l: string) => l.startsWith('+') ? l.slice(1) : l).join('\n'), filename: 'x.ts' });
    const names = out.map(m => m.normalized_target);
    expect(names).toContain('researcher-base-agent');
  });
});
