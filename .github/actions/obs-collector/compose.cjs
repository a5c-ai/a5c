// Compose observability JSON for a single job.
// CommonJS script invoked from the composite action to avoid shell quoting issues.
const fs = require('fs');

const env = (k, d = '') => process.env[k] ?? d;

let cov = null;
try {
  cov = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
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
    started_at: null,
    completed_at: new Date().toISOString(),
  },
  metrics: { coverage: cov },
};

process.stdout.write(JSON.stringify(obs, null, 2));
