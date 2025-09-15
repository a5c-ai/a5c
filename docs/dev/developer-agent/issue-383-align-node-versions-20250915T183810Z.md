# Align Node.js versions across workflows + .nvmrc

- Context: PR #465 docs/align-node-versions-383
- Goal: Standardize Node 20 across CI and local via .nvmrc and setup-node.

## Plan

- Verify .nvmrc and package.json engines
- Scan workflows for node-version mismatches
- Keep typecheck matrix [20,22]; ensure all others use 20 or .nvmrc
- Run lint, typecheck, tests
- Report status and update PR

## Actions

- Verified .nvmrc: 20
- package.json engines: node ">=20"
- Workflows: majority already pinned to 20 or .nvmrc; typecheck uses [20,22]; main.yml matrix set to [20]
- Ran lint, typecheck, tests: all green

## Result

- No code changes required; alignment already present per plan
- Proceed to post progress on PR and mark status check success

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
