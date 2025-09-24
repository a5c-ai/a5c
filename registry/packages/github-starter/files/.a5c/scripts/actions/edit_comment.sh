#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
const { Octokit } = require('@octokit/rest');
async function main(){
  const p = JSON.parse(process.env.ACTION_PARAMS_JSON||'{}');
  const body = String(p.body||p.comment||'');
  const id = Number(p.comment_id||p.id);
  const repoFull = process.env.GITHUB_REPOSITORY||'';
  if (!id || !body || !repoFull) return;
  const [owner, repo] = repoFull.split('/');
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN||process.env.A5C_AGENT_GITHUB_TOKEN });
  await octokit.issues.updateComment({ owner, repo, comment_id: id, body });
}
main().catch((e)=>{ console.error(e?.message||e); process.exit(1); });
NODE

