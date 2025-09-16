# Quiet control for enrich stderr hint (discovery)

Priority: low
Category: documentation

Context: `src/enrich.ts` now emits a one‑line stderr hint when the input appears to be a raw payload (non‑NE). This is helpful UX, but in some chained CLI contexts users may want to suppress the hint.

Proposal:

- Explore adding a `--quiet-hints` (or reuse existing global `--quiet` semantics if appropriate) to suppress non‑error UX notices in `enrich` while keeping actual error reporting unchanged.
- Document the flag in `docs/cli/reference.md` if implemented.

Notes:

- Related tracking: #701
- Non‑blocking; current behavior is acceptable and tests pass.
