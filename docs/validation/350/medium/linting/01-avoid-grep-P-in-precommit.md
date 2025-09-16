# [Validator] Linting - Avoid `grep -P` in pre-commit (portability)

Priority: medium priority
Category: linting

`scripts/precommit.sh` uses `grep -P` to detect trailing whitespace. `-P` (PCRE) is not universally available (e.g., default macOS/BSD grep lacks it), which can break local commits for contributors.

Suggested fix:

- Replace the check with a more portable alternative, e.g.:

```sh
# Trailing whitespace (spaces or tabs) at EOL
if grep -nE "[[:space:]]$" "$f" >/dev/null 2>&1; then
  echo "[precommit] Trailing whitespace: $f"
  TW_BAD=1
fi
```

or use `awk`/`sed` to detect trailing whitespace in a POSIX-compatible way.

Context: `scripts/precommit.sh`
