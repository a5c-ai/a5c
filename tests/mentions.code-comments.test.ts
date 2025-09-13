import { describe, it, expect, vi } from 'vitest';
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
        const enc = val.encoding || 'base64';
        const content = val.content;
        const size = val.size ?? Buffer.byteLength(content, enc === 'base64' ? 'utf8' : enc);
        const payload = enc === 'base64' ? { content: Buffer.from(content, 'utf8').toString('base64'), encoding: 'base64', size } : { content, encoding: enc, size };
        return { data: payload } as any;
      }
    }
  } as any;
}

describe('code comment mention scanning', () => {
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
    const locs = out.map(m => m.location);
    expect(locs).toContain('src/a.js:2');
    expect(locs.some(l => l?.startsWith('src/a.js:'))).toBe(true);
    expect(locs.some(l => l?.startsWith('src/b.ts:'))).toBe(true);
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

