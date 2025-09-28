#!/usr/bin/env bash
set -euo pipefail

issue_url=""
if [[ -n "${ACTION_PARAMS_JSON:-}" ]]; then
  issue_url=$(node -e "console.log(JSON.parse(process.env.ACTION_PARAMS_JSON).issue||'')")
fi

export issue_url

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
  const token = process.env.GITLAB_TOKEN || process.env.A5C_AGENT_GITLAB_TOKEN;
  const issueUrl = process.env.issue_url || '';
  const parsed = parseIssue(issueUrl);
  if (!token || !parsed) return;

  const host = (process.env.GITLAB_HOST || parsed.origin || 'https://gitlab.com').replace(/\/$/, '');
  const apiUrl = `${host}/api/v4/projects/${encodeURIComponent(parsed.project)}/issues/${parsed.issue_iid}`;
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: JSON.stringify({ state_event: 'close' })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to close issue: ${response.status} ${text}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
NODE

