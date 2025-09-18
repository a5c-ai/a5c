Hi team

## 🧹 Fix EditorConfig failure in Quick Checks

### Description

The Quick Checks workflow failed at step "Check EditorConfig compliance" due to missing final newline in `.a5c/create-pr.sh`. This breaks PR checks and skips tests.

- Workflow run: https://github.com/a5c-ai/events/actions/runs/17841957534
- Failing job: Lint, Typecheck, Unit Tests, Filenames, Actionlint, EditorConfig
- Error: `Wrong line endings or no final newline` in `.a5c/create-pr.sh`

### Plan

- Add final LF newline to `.a5c/create-pr.sh`
- Validate locally via `scripts/ci-editorconfig.sh`
- Open PR against `a5c/main` with build+bug labels

### Progress

- Repo checked out, deps installed, branch created.

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
