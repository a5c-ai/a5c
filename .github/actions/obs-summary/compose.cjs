// Compose observability JSON; designed for Node 18+ CommonJS execution
const fs = require('fs');

const env = (k, d = '') => process.env[k] ?? d;
const HIT = 'HIT', BYTES = 'BYTES', KEY = 'KEY';

const startedAtEnv = env('RUN_STARTED_AT') || env('GITHUB_RUN_STARTED_AT') || '';
const startedAt = startedAtEnv || new Date().toISOString();

let cov = null;
try { cov = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8')); } catch {}

const byKind = new Map();
for (const [k, v] of Object.entries(process.env)) {
  const m = /^CACHE_([A-Z0-9]+)_(HIT|BYTES|KEY)$/.exec(k);
  if (!m) continue;
  const kind = m[1].toLowerCase();
  const field = m[2];
  const rec = byKind.get(kind) || { kind };
  if (field === HIT) rec.hit = String(v).toLowerCase() === 'true' || String(v) === '1';
  else if (field === BYTES) {
    const n = Number(v);
    if (!Number.isNaN(n)) rec.bytes = n;
  } else if (field === KEY) rec.key = String(v);
  byKind.set(kind, rec);
}

const cacheEntries = Array.from(byKind.values());
const hits = cacheEntries.filter(e => e.hit).length;
const total = cacheEntries.length;
const bytes_total = cacheEntries.reduce((a, e) => a + (typeof e.bytes === 'number' ? e.bytes : 0), 0);
const cache = total
  ? { entries: cacheEntries, summary: { hits, misses: total - hits, total, hit_ratio: total ? hits / total : null, bytes_restored_total: bytes_total } }
  : null;

const end = new Date();
const endIso = end.toISOString();
let durationMs = null;
try {
  const s = new Date(startedAt);
  if (!isNaN(s.getTime())) durationMs = end.getTime() - s.getTime();
} catch {}

// Optionally parse Vitest JSON to include tests (retries, slowest)
let tests = null;
try {
  const vitest = JSON.parse(fs.readFileSync('vitest-results.json', 'utf8'));
  if (vitest && Array.isArray(vitest.testResults)) {
    const all = [];
    for (const tr of vitest.testResults) {
      for (const a of (tr.assertionResults || [])) {
        const meta = a.meta || {};
        const attempts = Number(meta.retryCount || meta.retries || 0);
        const duration = a.duration ?? null;
        all.push({
          fullName: a.fullName || a.title || '',
          status: a.status,
          duration_ms: typeof duration === 'number' ? duration : null,
          retries: attempts,
        });
      }
    }
    const slowest = all
      .filter(t => typeof t.duration_ms === 'number')
      .sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0))
      .slice(0, 10);
    const flaky = all.filter(t => (t.retries || 0) > 0);
    tests = {
      totals: {
        total: all.length,
        flaky: flaky.length,
        slow_count: slowest.length,
      },
      slowest,
      flaky,
    };
  }
} catch {}

const obs = {
  schema_version: '0.1',
  repo: env('GITHUB_REPOSITORY') || env('REPO'),
  workflow: env('GITHUB_WORKFLOW') || env('WORKFLOW_NAME'),
  job: env('JOB_NAME') || env('GITHUB_JOB'),
  run: {
    id: env('GITHUB_RUN_ID') || env('RUN_ID'),
    attempt: Number(env('GITHUB_RUN_ATTEMPT') || env('RUN_ATTEMPT') || '1'),
    sha: env('GITHUB_SHA') || env('SHA'),
    ref: env('GITHUB_REF') || env('BRANCH_REF'),
    actor: env('GITHUB_ACTOR', ''),
    event_name: env('GITHUB_EVENT_NAME', ''),
    conclusion: env('CONCLUSION', ''),
    started_at: startedAt,
    completed_at: endIso,
    duration_ms: durationMs,
  },
  metrics: { coverage: cov, cache },
  tests,
};

process.stdout.write(JSON.stringify(obs, null, 2));
