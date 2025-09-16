# [Low] Pre-commit skip message alignment

The pre-commit script checks `A5C_SKIP_PRECOMMIT` and `SKIP_PRECOMMIT` in addition to `SKIP_CHECKS`. The message printed on skip currently mentions only `SKIP_CHECKS=1`, which might confuse users who used the documented variables.

Suggested improvement:

- Align the skip message to mention all supported env vars: `A5C_SKIP_PRECOMMIT`, `SKIP_PRECOMMIT`, and `SKIP_CHECKS`.
- Optionally, deprecate `SKIP_CHECKS` in favor of the two explicit variables.

Context: scripts/precommit.sh
