# [Validator] Workflow runner label not standard

The a5c meta-workflow uses `runs-on: ubuntu-latest-m`, which is not a standard GitHub-hosted runner label. actionlint flags it as unknown.

- Impact: Low (non-blocking). May be intentional/custom.
- Suggestion: If this is a custom/self-hosted label, add it to `.github/actionlint.yaml` (runner-labels) so linters recognize it. If unintentional, switch to `ubuntu-latest`.

Context: `.github/workflows/a5c.yml`
