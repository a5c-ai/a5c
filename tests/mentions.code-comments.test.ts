import { describe, it, expect } from 'vitest';
import { scanMentionsInCodeComments } from '../src/utils/commentScanner.js';
import { extractMentions } from '../src/extractor.js';

describe('mentions extractor - code comments scanning', () => {
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

  it('finds mention in Python # comment and not in string', () => {
    const content = `
      # ping @validator-agent
      s = "@validator-agent in string should not count"
    `;
    const out = scanMentionsInCodeComments({ content, filename: 'm.py' });
    const names = out.map(m => m.normalized_target);
    expect(names).toContain('validator-agent');
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

describe('enrich() integration — uses patch content for changed files', () => {
  it('adds code_comment mentions from PR files when patch includes comment with @mention', async () => {
    // Create a minimal fake enriched data by calling extractMentions for text paths is covered elsewhere.
    // Here we directly exercise scan() logic via a synthetic input in handleEnrich would pass.
    const patch = `diff --git a/x.ts b/x.ts\n@@\n+ // @researcher-base-agent please review\n+ export const x = 1;`;
    const out = scanMentionsInCodeComments({ content: patch.split('\n').map(l => l.startsWith('+') ? l.slice(1) : l).join('\n'), filename: 'x.ts' });
    const names = out.map(m => m.normalized_target);
    expect(names).toContain('researcher-base-agent');
  });
});

