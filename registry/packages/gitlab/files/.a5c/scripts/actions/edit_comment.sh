#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
async function main() {
  const params = JSON.parse(process.env.ACTION_PARAMS_JSON || '{}');
  const body = String(params.body || params.comment || '');
  const noteId = Number(params.comment_id || params.id);
  const issueUrl = params.issue || params.url || '';
  const token = process.env.GITLAB_TOKEN || process.env.A5C_AGENT_GITLAB_TOKEN;
  if (!noteId || !body || !token) return;

  const match = /^(?<origin>https?:\/\/[^\s?#]+)\/(?<project>[^\s?#]+)\/\-\/issues\/(?<iid>\d+)(?:[#?].*)?$/i.exec(issueUrl || '');
  if (!match || !match.groups) return;

  const origin = (process.env.GITLAB_HOST || match.groups.origin || 'https://gitlab.com').replace(/\/$/, '');
  const project = decodeURIComponent(match.groups.project);
  const issueIid = Number(match.groups.iid);
  if (!project || !issueIid) return;

  const apiUrl = `${origin}/api/v4/projects/${encodeURIComponent(project)}/issues/${issueIid}/notes/${noteId}`;
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: JSON.stringify({ body })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to edit comment: ${response.status} ${text}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
NODE

