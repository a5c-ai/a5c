# Fix: emit default sink should be stdout

Issue: #807

## Plan

- Reproduce failing test locally
- Change default sink selection to stdout; keep `--out` ⇒ `file` behavior
- Verify tests (`vitest`) pass locally
- Update docs if they drift (CLI reference already documents stdout default and out⇒file)
- Open PR linking issue; request validation

## Notes

- Root cause: `src/emit.ts` used `opts.sink || (opts.out ? "file" : "github")` which made `github` the implicit default and fails when token is absent in tests/CI.
