import { describe, it, expect } from 'vitest';
import { handleEnrich } from '../src/enrich.js';
import fs from 'node:fs';

describe('rules composed events', () => {
  it('emits composed event for conflicted low-priority PR', async () => {
    // Prepare sample: use existing PR sample and ensure labels include 'priority:low'
    const samplePath = 'samples/pull_request.synchronize.json';
    const base = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    base.pull_request.labels = [{ name: 'priority:low' }];
    const tmpIn = 'tmp.pr.low.json';
    fs.writeFileSync(tmpIn, JSON.stringify(base));

    // Rules in JSON format (supported loader)
    const rules = [
      {
        key: 'conflict_in_pr_with_low_priority_label',
        when: {
          all: [
            { path: 'enriched.github.pr.mergeable_state', in: ['dirty', 'blocked'] },
            { path: 'payload.pull_request.labels[*].name', contains: 'priority:low' }
          ]
        },
        targets: ['developer-agent']
      }
    ];
    const tmpRules = 'tmp.rules.json';
    fs.writeFileSync(tmpRules, JSON.stringify(rules));

    const res = await handleEnrich({ in: tmpIn, flags: {}, rules: tmpRules, labels: [] });
    const composed = (res.output as any).composed || [];
    const keys = composed.map((c: any) => c.key);
    expect(keys).toContain('conflict_in_pr_with_low_priority_label');
    const match = composed.find((c: any) => c.key === 'conflict_in_pr_with_low_priority_label');
    expect((match?.targets || [])).toContain('developer-agent');
  });

  it('does not emit when conditions not met', async () => {
    const samplePath = 'samples/pull_request.synchronize.json';
    const base = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    base.pull_request.mergeable_state = 'clean';
    base.pull_request.labels = [{ name: 'documentation' }];
    const tmpIn = 'tmp.pr.clean.json';
    fs.writeFileSync(tmpIn, JSON.stringify(base));

    const rules = [
      {
        key: 'conflict_in_pr_with_low_priority_label',
        when: {
          all: [
            { path: 'payload.pull_request.mergeable_state', in: ['dirty', 'blocked'] },
            { path: 'payload.pull_request.labels[0].name', contains: 'priority:low' }
          ]
        },
        targets: ['developer-agent']
      }
    ];
    const tmpRules = 'tmp.rules.json';
    fs.writeFileSync(tmpRules, JSON.stringify(rules));

    const res = await handleEnrich({ in: tmpIn, flags: {}, rules: tmpRules, labels: [] });
    const composed = (res.output as any).composed || [];
    const keys = composed.map((c: any) => c.key);
    expect(keys).not.toContain('conflict_in_pr_with_low_priority_label');
  });
});
