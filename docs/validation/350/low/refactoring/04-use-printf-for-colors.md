# [Validator] Refactoring - Use `printf` for colored output

Priority: low priority
Category: refactoring

`scripts/precommit.sh` prints ANSI color escape sequences via `echo`, which may not interpret escapes portably. Using `printf` improves reliability:

Example:

```sh
fail() {
  printf '[precommit] \033[31mFAIL\033[0m: %s\n' "$1" >&2
  exit 1
}
```

File: `scripts/precommit.sh`
