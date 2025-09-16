# Docs tweak: CLI select/filter examples

Minor improvements to README examples:

- Add explicit note that a non-matching `--filter` exits with code 2 and prints no output.
- Show a `jq -c` variant for compact output when using `--select`.

Rationale: Improves discoverability and aligns with e2e tests.
