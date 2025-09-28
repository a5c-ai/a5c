#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
function parseMr(url) {
  const match = /^(?<origin>https?:\/\/[^\s?#]+)\/(?<project>[^\s?#]+)\/\-\/merge_requests\/(?<iid>\d+)(?:[#?].*)?$/i.exec(url || '');
  if (!match || !match.groups) return null;
  return {
    origin: match.groups.origin.replace(/\/$/, ''),
    project: decodeURIComponent(match.groups.project),
    mr_iid: Number(match.groups.iid)
  };
}

async function main() {
  const params = JSON.parse(process.env.ACTION_PARAMS_JSON || '{}');
  const mrUrl = params.pull_request || params.pr || params.merge_request || '';
  const parsed = parseMr(mrUrl);
  const token = process.env.GITLAB_TOKEN || process.env.A5C_AGENT_GITLAB_TOKEN;
  if (!token || !parsed) return;

  const host = (process.env.GITLAB_HOST || parsed.origin || 'https://gitlab.com').replace(/\/$/, '');
  const apiUrl = `${host}/api/v4/projects/${encodeURIComponent(parsed.project)}/merge_requests/${parsed.mr_iid}/merge`;
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'PRIVATE-TOKEN': token
    }
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to merge merge request: ${response.status} ${text}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
NODE

