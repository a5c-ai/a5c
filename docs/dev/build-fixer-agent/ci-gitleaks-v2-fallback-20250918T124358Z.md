# Fix: Gitleaks v2 fallback (TruffleHog) fails on unverified secrets

- Run: https://github.com/a5c-ai/events/actions/runs/17828945123
- Head: 44f7eeb394f0b616dc752f38f6e963dba30bb705

## Plan

- Add `--only-verified` to TruffleHog push fallback to reduce noise and match PR fallback behavior.
- Keep licensed `gitleaks-action@v2` path unchanged.

## Notes

- Failure was exit code 183 with 0 verified, 11 unverified findings. Tests include placeholder tokens (e.g., `ghs_override_...`) that trigger unverified detectors.
