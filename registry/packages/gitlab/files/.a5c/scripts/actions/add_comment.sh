#!/usr/bin/env bash
set -euo pipefail

# Expects: GITLAB_TOKEN in env
# Params passed via ACTION_PARAMS_JSON: { "issue": "<url>", "comment": "text" }

issue_url=""
comment_body=""
if [[ -n "${ACTION_PARAMS_JSON:-}" ]]; then
  issue_url=$(node -e "console.log(JSON.parse(process.env.ACTION_PARAMS_JSON).issue||'')")
  comment_body=$(node -e "console.log(JSON.parse(process.env.ACTION_PARAMS_JSON).comment||JSON.parse(process.env.ACTION_PARAMS_JSON).body||'')")
fi

if [[ -z "$comment_body" ]]; then
  echo "::warning::add_comment: empty comment body"
  exit 0
fi

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
  const issueUrl = process.env.ACTION_PARAMS_JSON
    ? JSON.parse(process.env.ACTION_PARAMS_JSON || '{}').issue || ''
    : process.env.issue_url || '';
  const comment = process.env.ACTION_PARAMS_JSON
    ? JSON.parse(process.env.ACTION_PARAMS_JSON || '{}').comment || JSON.parse(process.env.ACTION_PARAMS_JSON || '{}').body || ''
    : process.env.comment_body || '';
  const parsed = parseIssue(issueUrl);
  if (!token || !parsed || !comment) return;

  const host = (process.env.GITLAB_HOST || parsed.origin || 'https://gitlab.com').replace(/\/$/, '');
  const apiUrl = `${host}/api/v4/projects/${encodeURIComponent(parsed.project)}/issues/${parsed.issue_iid}/notes`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    },
    body: JSON.stringify({ body: comment })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to add comment: ${response.status} ${text}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
NODE

