#!/usr/bin/env bash
set -euo pipefail

node - <<'NODE'
const { Octokit } = require('@octokit/rest');
function parse(url) {
  const m = /https?:\/\/[^\s?#]+\/(?<owner>[^\/]+)\/(?<repo>[^\/]+)\/(?:issues|pull)\/(?<num>\d+)/i.exec(url||'');
  if (!m || !m.groups) return null;
  return { owner: m.groups.owner, repo: m.groups.repo, number: Number(m.groups.num) };
}
async function main(){
  const params = JSON.parse(process.env.ACTION_PARAMS_JSON||'{}');
  const parsed = parse(params.issue||'');
  if (!parsed) return;
  const add = Array.isArray(params.add_labels)?params.add_labels:[];
  const remove = Array.isArray(params.remove_labels)?params.remove_labels:[];
  const token = process.env.GITHUB_TOKEN || process.env.A5C_AGENT_GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });
  if (add.length) await octokit.issues.addLabels({ owner: parsed.owner, repo: parsed.repo, issue_number: parsed.number, labels: add });
  for (const name of remove) {
    try { await octokit.issues.removeLabel({ owner: parsed.owner, repo: parsed.repo, issue_number: parsed.number, name }); } catch {}
  }
}
main().catch(()=>{});
NODE

