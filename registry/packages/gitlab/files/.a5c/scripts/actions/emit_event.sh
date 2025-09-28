#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
async function main() {
  const params = JSON.parse(process.env.ACTION_PARAMS_JSON || '{}');
  const token = process.env.GITLAB_TOKEN || process.env.A5C_AGENT_GITLAB_TOKEN;
  const project = process.env.GITLAB_PROJECT_PATH || process.env.GITLAB_REPOSITORY || '';
  if (!token || !project) return;

  const trigger = params.event_type || params.type || 'custom';
  const pipelineVariables = params.payload || {};
  const ref = params.ref || process.env.GITLAB_REF || 'main';

  const host = (process.env.GITLAB_HOST || 'https://gitlab.com').replace(/\/$/, '');
  const apiUrl = `${host}/api/v4/projects/${encodeURIComponent(project)}/trigger/pipeline`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: JSON.stringify({ ref, token: params.trigger_token, variables: { EVENT_TYPE: trigger, ...pipelineVariables } })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to trigger pipeline: ${response.status} ${text}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
NODE

