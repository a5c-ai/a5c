# CI Fix: obs-summary quoting bug

- Context: Failed workflow run for Tests on branch `a5c/main` (run 17725240712) failed at step "Observability summary" due to Node ReferenceError from unquoted identifiers in JS snippet within composite action `.github/actions/obs-summary`.
- Root cause: Bash used single-quoted `node -e '...JS...'` while the JS snippet itself used single quotes for tokens like 'HIT'. Inside single-quoted shell strings, single quotes cannot appear, leading to quotes being stripped and identifiers like HIT seen by Node, causing `ReferenceError: HIT is not defined`.

## Plan
- Patch `.github/actions/obs-summary/action.yml` to use double quotes for JS string literals ("HIT", "BYTES", "KEY", "true", "1").
- Keep all other logic intact (bytes/key capture, duration calculation, step summary, artifact upload).
- Open PR against `a5c/main` with build/bug labels and link to failing run.
- Let CI validate. If green, merge.

## Notes
- Category: Framework/Infrastructure issue (composite action quoting).
- No product code changes.
