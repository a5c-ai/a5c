import { describe, it, expect } from 'vitest';
import { handleEnrich } from '../src/enrich.js';

function isIso8601(s?: string) {
  return !!s && /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s);
}

describe('handleEnrich', () => {
  it('propagates flags and wraps metadata under enriched', async () => {
    const flags = { dryRun: true, mode: 'fast' } as any;
    const { code, output } = await handleEnrich({ in: 'samples/issue_comment.created.json', labels: ['x=y'], rules: 'r.yml', flags });
    expect(code).toBe(0);
    expect(output).toBeTruthy();
    expect(typeof output.id).toBe('string');
    expect(output.provider).toBe('github');
    expect(typeof output.type).toBe('string');
    expect(isIso8601(output.occurred_at)).toBe(true);
    expect(output.payload).toBeTruthy();
    expect(output.labels).toEqual(['x=y']);

    // Enriched structure shape
    expect(output.enriched).toBeTruthy();
    expect(output.enriched?.metadata).toEqual({ rules: 'r.yml' });
    expect(output.enriched?.derived).toBeTruthy();
    expect((output.enriched as any).derived.flags).toEqual(flags);
  });

  it('adds mentions from push commit messages', async () => {
    const enriched = await handleEnrich({ in: 'samples/push.json', labels: [], rules: undefined, flags: {} });
    const mentions = (enriched.output.enriched as any)?.mentions || [];
    expect(Array.isArray(mentions)).toBe(true);
    // sample includes `@developer-agent` in one commit
    const names = mentions.map((m: any) => m.normalized_target);
    expect(names).toContain('developer-agent');
  });

  it('merges GitHub enrichment when flag enabled but missing token marks partial', async () => {
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: { use_github: 'true' } });
    const gh = (res.output.enriched as any)?.github;
    expect(gh).toBeTruthy();
    expect(gh.partial).toBeTruthy();
  });
});
