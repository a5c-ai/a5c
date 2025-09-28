#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
function parseIssue(url) {
  const match = /^(?<origin>https?:\/\/[^\s?#]+)\/(?<project>[^\s?#]+)\/\-\/issues\/(?<iid>\d+)(?:[#?].*)?$/i.exec(url || '');
  if (!match || !match.groups) return null;
  return {
    origin: match.groups.origin.replace(/\/$/, ''),
    project: decodeURIComponent(match.groups.project),
    issue_iid: Number(match.groups.iid)
  };
}

async function main() {
  const params = JSON.parse(process.env.ACTION_PARAMS_JSON || '{}');
  const parsed = parseIssue(params.issue || '');
  const token = process.env.GITLAB_TOKEN || process.env.A5C_AGENT_GITLAB_TOKEN;
  if (!token || !parsed) return;

  const host = (process.env.GITLAB_HOST || parsed.origin || 'https://gitlab.com').replace(/\/$/, '');
  const apiUrl = `${host}/api/v4/projects/${encodeURIComponent(parsed.project)}/issues/${parsed.issue_iid}`;
  const add = Array.isArray(params.add_labels) ? params.add_labels : [];
  const remove = Array.isArray(params.remove_labels) ? params.remove_labels : [];

  if (add.length) {
    const response = await fetch(`${apiUrl}/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PRIVATE-TOKEN': token
      },
      body: JSON.stringify({ labels: add.join(',') })
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to add labels: ${response.status} ${text}`);
      process.exit(1);
    }
  }

  for (const name of remove) {
    const response = await fetch(`${apiUrl}/labels/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: {
        'PRIVATE-TOKEN': token
      }
    });
    if (!response.ok && response.status !== 404) {
      const text = await response.text();
      console.error(`Failed to remove label ${name}: ${response.status} ${text}`);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
NODE

