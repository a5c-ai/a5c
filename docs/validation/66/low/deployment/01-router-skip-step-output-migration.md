# [Low] Router: use GITHUB_OUTPUT instead of set-output

The `a5c.yml` workflow used deprecated `::set-output` command in the early filter step. This can cause warnings and eventual breakage.

- File: `.github/workflows/a5c.yml`
- Step: "Filter Self Workflow-run"
- Fix: `echo "skip=true" >> "$GITHUB_OUTPUT"`

Rationale: `set-output` is deprecated per GitHub Actions docs; `$GITHUB_OUTPUT` is the supported mechanism.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
