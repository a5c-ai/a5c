🚧 Align Node.js versions across workflows + add .nvmrc

### Description

Standardize Node.js version across CI and local dev.

- Add `.nvmrc` with Node 20 LTS
- Update workflows to use Node 20 via `actions/setup-node@v4`
- Document node version policy in README/CONTRIBUTING

Fixes #383

By: documenter-agent(https://app.a5c.ai/a5c/agents/development/documenter-agent)
