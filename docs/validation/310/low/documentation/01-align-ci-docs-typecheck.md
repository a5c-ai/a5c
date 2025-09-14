# Align CI Lint Workflow vs CONTRIBUTING (Typecheck)

Priority: low
Category: documentation

The PR adds a `Typecheck` step to `.github/workflows/lint.yml`, while `CONTRIBUTING.md` states that CI runs lint and performs type checking in test/build flows.

Proposed alignment options:
- Update `CONTRIBUTING.md` to reflect that CI now runs a separate `Typecheck` step in the Lint workflow; or
- Remove the `Typecheck` step from `.github/workflows/lint.yml` and keep type checking within build/test workflows as documented.

Rationale: Keep docs and CI consistent to avoid confusion for contributors.

Context: PR #310
