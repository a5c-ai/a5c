import { describe, it, expect } from 'vitest';
import { extractMentions } from '../src/extractor.js';
describe('mentions extractor - commit messages', () => {
    it('extracts simple @agent mention', () => {
        const text = 'Fix bug in parser. Thanks to @developer-agent for the tip.';
        const out = extractMentions(text, 'commit_message', { knownAgents: ['developer-agent'] });
        expect(out.length).toBe(1);
        expect(out[0].normalized_target).toBe('developer-agent');
        expect(out[0].kind).toBe('agent');
        expect(out[0].source).toBe('commit_message');
        expect(out[0].context).toContain('@developer-agent');
    });
});
