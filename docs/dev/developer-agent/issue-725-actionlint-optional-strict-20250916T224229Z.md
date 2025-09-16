# Work Log: Optional strict actionlint (issue #725)

- Goal: When REQUIRE_ACTIONLINT=true, fail CI on actionlint findings. Default remains advisory.
- Touch points:
  - scripts/ci-actionlint.sh
  - .github/workflows/quick-checks.yml

## Plan

1. Add env flag parsing in script; compute advisory vs strict mode.
2. In strict mode, exit non-zero if any findings.
3. In advisory mode, keep warnings and exit 0.
4. Update workflow to pass repository variable into env.

## Notes

- Logs should clearly print mode.
- Prefer binary install; fallback to Docker unchanged.
