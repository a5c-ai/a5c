import { describe, it, expect } from 'vitest';
import { extractMentions } from '../src/extractor.js';
describe('mentions extractor - PR body', () => {
    it('extracts multiple mentions with context', () => {
        const text = `This PR implements feature X.

    Reviewers: @developer-agent and @someone_else
    Also ping @team/platform for visibility.`;
        const out = extractMentions(text, 'pr_body', { knownAgents: ['developer-agent'] });
        const names = out.map((m) => m.normalized_target).sort();
        expect(names).toContain('developer-agent');
        expect(names).toContain('someone_else');
        expect(names).toContain('team/platform');
        expect(out.every((m) => m.context.length > 0)).toBe(true);
    });
});
