#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
const { Octokit } = require('@octokit/rest');
async function main(){
  const p = JSON.parse(process.env.ACTION_PARAMS_JSON||'{}');
  const id = Number(p.comment_id||p.id);
  const repoFull = process.env.GITHUB_REPOSITORY||'';
  if (!id || !repoFull) return;
  const [owner, repo] = repoFull.split('/');
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN||process.env.A5C_AGENT_GITHUB_TOKEN });
  await octokit.issues.deleteComment({ owner, repo, comment_id: id });
}
main().catch((e)=>{ console.error(e?.message||e); process.exit(1); });
NODE

