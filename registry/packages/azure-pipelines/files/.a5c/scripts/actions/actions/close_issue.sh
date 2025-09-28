#!/usr/bin/env bash
set -euo pipefail

issue_url=""
if [[ -n "${ACTION_PARAMS_JSON:-}" ]]; then
  issue_url=$(node -e "console.log(JSON.parse(process.env.ACTION_PARAMS_JSON).issue||'')")
fi

node - <<'NODE'
const { Octokit } = require('@octokit/rest');
function parse(url) {
  const m = /https?:\/\/[^\s?#]+\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/(?:issues|pull)\/(?<num>\d+)/i.exec(url||'');
  if (!m || !m.groups) return null;
  return { owner: m.groups.owner, repo: m.groups.repo, number: Number(m.groups.num) };
}
async function main(){
  const token = process.env.GITHUB_TOKEN || process.env.A5C_AGENT_GITHUB_TOKEN;
  if (!token) return;
  const octokit = new Octokit({ auth: token });
  const parsed = parse(process.env.issue_url||'');
  if (!parsed) return;
  await octokit.issues.update({ owner: parsed.owner, repo: parsed.repo, issue_number: parsed.number, state: 'closed' });
}
main().catch(()=>{});
NODE

