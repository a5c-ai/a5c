#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
const { Octokit } = require('@octokit/rest');
async function main(){
  const p = JSON.parse(process.env.ACTION_PARAMS_JSON||'{}');
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return;
  const octokit = new Octokit({ auth: token });
  const repoFull = process.env.GITHUB_REPOSITORY || '';
  if (!repoFull) return;
  const [owner, repo] = repoFull.split('/');
  const event_type = String(p.event_type||p.type||'custom');
  const client_payload = p.payload || {};
  await octokit.repos.createDispatchEvent({ owner, repo, event_type, client_payload });
}
main().catch((e)=>{ console.error(e?.message||e); process.exit(1); });
NODE

