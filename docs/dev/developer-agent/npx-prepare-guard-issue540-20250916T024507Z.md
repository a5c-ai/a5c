# Guard prepare for npx consumers (Issue #540)

- Problem: `npx @a5c-ai/events` install can fail with `sh: 1: husky: not found` because `prepare` runs `husky && npm run build` but devDependencies are not installed for consumers.
- Fix: Replace `scripts.prepare` with a guarded script that only runs Husky + build when in a git repo (development), and no-ops for packed installs.
- Verification: local tests pass; `npm pack` + install of tarball without dev deps succeeds; CLI runs `--help`, `--version`, `normalize | validate`.
