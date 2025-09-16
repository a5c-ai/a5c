# Align CI Lint Workflow vs CONTRIBUTING (Typecheck)

Priority: low
Category: documentation

Status: resolved — no action required.

Summary:

- `.github/workflows/lint.yml` includes a dedicated "Typecheck (src-only)" step.
- `CONTRIBUTING.md` now explicitly documents that CI runs `npm run lint` and a separate Typecheck step (src‑only) in the Lint workflow.

Outcome:

- Docs and CI are aligned; keeping this entry for traceability of the review.

Context: PR #310
