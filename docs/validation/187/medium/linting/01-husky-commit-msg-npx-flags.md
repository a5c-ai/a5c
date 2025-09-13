# Husky commit-msg npx flags

Severity: medium priority  
Category: linting

## Finding

The commit-msg hook uses a non-standard `npx` invocation:

```
npx --no husky -y commitlint --edit "$1"
```

- `husky` here is not an `npx` option and appears accidental.
- The mix of `--no` and `-y` is confusing; intent seems to be “use local binary without network installs”.
- In local testing, direct `npx --no commitlint` fails to resolve the binary, while the hook may still work due to `-y` prompting auto‑install, which is slower and brittle offline.

## Recommendation

Prefer a clear, deterministic call that favors local binaries and avoids network installs:

```
# Option A (prefer): use local bin only, fail if missing
npx --yes --no-install commitlint --edit "$1"

# Option B: allow auto-install as fallback
npx --yes commitlint --edit "$1"
```

Rationale:

- Aligns with `pre-commit` which already uses `npx --yes --no-install lint-staged`.
- Avoids accidental installs during commits and speeds up hooks.
