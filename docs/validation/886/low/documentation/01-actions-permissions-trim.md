---
title: Actions E2E sample — tighten permissions
priority: low
category: documentation
---

Context: PR #886 adds `docs/ci/actions-e2e-example.md` with a minimal workflow. The job `permissions:` block can be simplified and avoid unsupported keys.

Findings:

- `repository-projects: read` is not a supported job permission in GitHub Actions and can be removed from the example.
- `id-token: write` is not needed for the documented steps (no OIDC usage). Consider removing to follow least-privilege.
- For `repository_dispatch` via `events emit --sink github`, the default `GITHUB_TOKEN` in the same repository typically suffices; explicit extra permissions beyond `contents: read` are not required for this sample.

Suggestion:

- Trim to just what the sample actually uses, e.g.:

```yaml
permissions:
  contents: read
  actions: read
```

- If cross-repo dispatch is desired, call that out separately and document the need for a PAT with appropriate repo scope in a secret.

Rationale: least-privilege guidance and preventing confusion from unsupported permission keys.
