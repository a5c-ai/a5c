# [Validator] Documentation — Core types list alignment

Severity: low priority

In `docs/specs/README.md` §3, the "Core types" list currently uses `pr` and `comment`, whereas the NE schema (`docs/specs/ne.schema.json`) and the rest of the docs use `pull_request` and `issue_comment`.

Recommended fix (non-blocking in this PR):

- Replace `pr` -> `pull_request`
- Replace `comment` -> `issue_comment`

Rationale:

- Keep top-level documentation consistent with the canonical schema enum and examples.
- Prevent confusion for users implementing adapters or reading the spec note introduced in this PR.

Context lines for reference (as of this branch):

```
- Core types: repo, ref, commit, workflow_run, job, step, pr, issue, comment, release, deployment, check_run, alert.
```
