# [Low] precommit: use portable grep for trailing whitespace

The pre-commit script used `grep -P` for trailing-whitespace detection, which
is not supported on macOS/BSD grep. This can cause hooks to silently skip or
fail on contributor machines.

## Change
- Replace `grep -P "\s$"` with `grep -nE "[[:space:]]$"` for POSIX portability.
- Also switched echo with printf in helper functions for consistent escapes.

## Context
- File: `scripts/precommit.sh`
- PR: #350 (branch `chore/precommit-hardening-303`)

## Priority
- low priority — fixed inline in this PR.

