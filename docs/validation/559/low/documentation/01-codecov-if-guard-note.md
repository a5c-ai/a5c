# [Low] Documentation – Clarify Codecov step `if` guard

## Summary

The README and docs include a GitHub Actions snippet for optional Codecov uploads:

```yaml
- name: Upload coverage to Codecov (optional)
  if: ${{ env.CODECOV_TOKEN != '' }}
  env:
    CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
  run: |
    bash scripts/coverage-upload.sh
```

This works, but for maximum clarity and to avoid any ambiguity about when the `if:` is evaluated, consider either:

- Defining `CODECOV_TOKEN` at the job level `env:` (so the `if:` clearly sees it), or
- Using `if: ${{ secrets.CODECOV_TOKEN != '' }}` directly in the condition.

Both approaches are functionally equivalent in typical usage; the alternatives may be clearer to readers unfamiliar with step‑level `env` and `if` evaluation order.

## Rationale

- Improves readability and removes subtlety around `env` resolution timing in GitHub Actions.
- Retains opt‑in behavior without changing functionality.

## Recommendation (non‑blocking)

Keep the current snippet and optionally add a one‑line note in docs indicating that using `secrets.CODECOV_TOKEN` directly in the `if:` is also acceptable, or move `CODECOV_TOKEN` to a job‑level `env:`.
