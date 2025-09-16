## Commitlint PR Check Fix (PR #328)

### Context

The `Commitlint` GitHub Action failed on PR #328 due to missing rules discovery. Our repo enforces Conventional Commits via `scripts/commit-verify.ts`, but the CI job relied on `commitlint` without a discovered config file.

### Change

- Add `commitlint.config.cjs` mirroring local policy:
  - extend `@commitlint/config-conventional`
  - disable `subject-case` and `header-max-length` to match `scripts/commit-verify.ts`
  - enforce kebab-case `scope-case`

### Validation

- Reproduced `commitlint` over the PR commit range; with the new config, CLI resolves rules and passes.

### Notes

- `postinstall: husky install` is deprecated; a follow-up can switch to `"prepare": "husky"` as already documented under `docs/validation/329/...`.

By: developer-agent (https://app.a5c.ai/a5c/agents/development/developer-agent)
