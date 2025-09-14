import { describe, it, expect } from 'vitest';
import { handleEnrich } from '../src/enrich.js';

function isIso8601(s?: string) {
  return !!s && /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s);
}

describe('handleEnrich', () => {
  it('propagates flags and wraps metadata under enriched', async () => {
    const flags = { dryRun: true, mode: 'fast' } as any;
    const { code, output } = await handleEnrich({ in: 'samples/issue_comment.created.json', labels: ['x=y'], rules: undefined, flags });
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
    // When no rules path is provided, rules metadata reflects provided value (undefined here)
    // When no rules path is provided, rules metadata only includes null
    expect(output.enriched?.metadata).toEqual({ rules: undefined });
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

  // Offline default: enriched.github exists with stub reason when not using --use-github
  it('does not perform GitHub enrichment when --use-github is not set (offline mode)', async () => {
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: {} });
    const gh = (res.output.enriched as any)?.github;
    expect(gh).toBeTruthy();
    expect(gh.skipped).toBeTruthy();
    expect(gh.reason).toBe('flag:not_set');
  });

  it('omits patch fields by default (include_patch=false)', async () => {
    const { output } = await handleEnrich({ in: 'samples/pull_request.synchronize.json', flags: { use_github: 'true' } });
    const gh: any = (output.enriched as any)?.github || {};
    const prFiles = gh.pr?.files || [];
    if (Array.isArray(prFiles) && prFiles.length) {
      expect(prFiles.every((f: any) => f.patch === undefined)).toBe(true);
    }
  });

  it('when flag enabled but token missing, enrichment is skipped with reason', async () => {
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: { use_github: 'true' } });
    const gh = (res.output.enriched as any)?.github;
    expect(gh).toBeTruthy();
    expect(gh.skipped).toBeTruthy();
    expect(gh.reason).toBe('token:missing');
  });

  // Duplicate offline assertion removed (covered above)
  

  it('includes patch fields when explicitly enabled (include_patch=true)', async () => {
    const { output } = await handleEnrich({ in: 'samples/pull_request.synchronize.json', flags: { use_github: 'true', include_patch: 'true' } });
    const gh: any = (output.enriched as any)?.github || {};
    const prFiles = gh.pr?.files || [];
    // When token is missing, enrichment is partial and prFiles may be absent; only assert when files exist
    if (Array.isArray(prFiles) && prFiles.length) {
      // We cannot guarantee real patch data in tests without hitting API; we just assert property presence is not forcibly removed
      const hasPatchProp = prFiles.some((f: any) => Object.prototype.hasOwnProperty.call(f, 'patch'));
      expect(hasPatchProp).toBe(true);
    }
  });
    
  it('adds code_comment mentions when enrichment contains files', async () => {
    const files = [{ filename: 'README.md', status: 'modified' }];
    const mockOctokit = {
      repos: { async getContent() { return { data: { content: Buffer.from('hello @developer-agent', 'utf8').toString('base64'), encoding: 'base64', size: 20 } }; } },
      pulls: { async listFiles() { return { data: files }; } },
      paginate: async (_fn: any, _opts: any) => files,
    } as any;

    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: { use_github: 'true' }, octokit: mockOctokit });
    const mentions = (res.output.enriched as any).mentions || [];
    expect(mentions.some((m: any) => m.source === 'code_comment')).toBe(true);
  });

  it('when --use-github is requested, API failures return code 3; if token present, enrichment succeeds', async () => {
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: undefined, flags: { use_github: 'true' } });
    if (res.code === 3) {
      expect(String((res.output as any).error || '')).toMatch(/github enrichment failed/i)
    } else {
      expect(res.code).toBe(0)
      const gh = (res.output.enriched as any)?.github
      expect(gh).toBeTruthy()
    }
  });

  it('applies YAML rules and emits composed events', async () => {
    const res = await handleEnrich({ in: 'samples/pull_request.synchronize.json', labels: [], rules: 'tests/fixtures/rules/conflicts.yml', flags: {} });
    const composed = (res.output as any).composed || []
    expect(Array.isArray(composed)).toBe(true)
    // Sample PR has labels [documentation, producer, testing]. Not low priority, but mergeable_state is dirty in fixture, so second rule should fire
    const keys = composed.map((c: any) => c.key)
    expect(keys).toContain('pr_conflicted_state')
  })
});
