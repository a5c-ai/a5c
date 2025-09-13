# [Low] Tests – Add basic CLI smoke tests

Context: PR #59 on branch `feat/sdk-cli-scaffold-issue43`

Observation
- `vitest` is configured but there are no tests.

Suggestion
- Add minimal tests verifying:
  - `normalize` outputs required fields (`id`, `provider`, `occurred_at`).
  - `--label` produces expected labels.
  - `enrich --flag` echoes flags in `enriched.derived.flags`.

Acceptance
- `npm test` runs and asserts these basics.

