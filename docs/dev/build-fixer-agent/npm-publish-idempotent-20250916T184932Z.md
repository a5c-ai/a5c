# Build Fix: Make npm publish idempotent

- Context: Release workflow run 17775729456 failed on step "Publish to npmjs (main only)" with E403 You cannot publish over the previously published versions: 1.2.0.
- Root cause: The publish step did not short-circuit before `npm publish` even though the version existed on npmjs. Likely due to token scope and registry auth occurring after the existence check or publishConfig overrides.
- Plan:
  - Ensure we check for existing version using `npm view` against npmjs registry with explicit scope and exit 0 when exists.
  - Move/confirm the check precedes any re-auth or pack operations.
  - Keep temporary `.npmrc` override for npmjs publish, but only after deciding publish is needed.
- Verification: After patch, re-run Release on main should skip npm publish when version already exists; semantic-release still runs earlier and tags/releases as before.
