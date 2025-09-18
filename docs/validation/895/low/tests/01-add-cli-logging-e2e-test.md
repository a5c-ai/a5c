# Add e2e test: CLI logging format flag/env

Priority: low priority
Category: tests

## Summary

We have unit tests for `createLogger` and a help text smoke test. Add a CLI-level e2e test that verifies `--log-format=json` (or `A5C_LOG_FORMAT=json`) causes logs from a command that emits logs (e.g., `events reactor` with a tiny YAML) to be JSON lines on stderr.

## Proposed Test

- Create a temporary YAML with one trivial handler so `reactor` logs a couple of lines.
- Run `node dist/cli.js reactor --in samples/push.json --file <tmp.yaml> --log-format json` and capture stderr.
- Assert stderr contains valid JSON objects with `level` and `msg` fields.

## Notes

- Keep the test fast and isolated. Use existing samples for input.
