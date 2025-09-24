#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
const { Octokit } = require('@octokit/rest');
function parse(url){
  const m=/https?:\/\/[^\s?#]+\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/pull\/(?<num>\d+)/i.exec(url||'');
  if (!m||!m.groups) return null; return { owner:m.groups.owner, repo:m.groups.repo, number:Number(m.groups.num)};
}
async function main(){
  const p = JSON.parse(process.env.ACTION_PARAMS_JSON||'{}');
  const prUrl = p.pull_request||p.pr||'';
  const parsed = parse(prUrl);
  if (!parsed) return;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN||process.env.A5C_AGENT_GITHUB_TOKEN });
  await octokit.pulls.update({ owner: parsed.owner, repo: parsed.repo, pull_number: parsed.number, state: 'closed' });
}
main().catch((e)=>{ console.error(e?.message||e); process.exit(1); });
NODE

