#!/usr/bin/env bash
set -euo pipefail

# Expects: GITHUB_TOKEN in env
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
  const issueUrl = process.env.issue_url || '';
  const comment = process.env.comment_body || '';
  const parsed = parse(issueUrl);
  if (!parsed || !comment) return;
  await octokit.issues.createComment({ owner: parsed.owner, repo: parsed.repo, issue_number: parsed.number, body: comment });
}
main().catch(()=>{});
NODE

