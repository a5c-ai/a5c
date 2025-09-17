# EditorConfig Checker: default 5.1.9 + dynamic flags

## Plan

- Default `EDITORCONFIG_CHECKER_VERSION` to 5.1.9; override via repo/org Variable.
- Detect `-format github-actions` support; fall back when unavailable.
- Drop hard `-color` for broader compatibility.
- Update Quick Checks env to `${{ vars.EDITORCONFIG_CHECKER_VERSION || '5.1.9' }}`.
- Update docs to reflect behavior and bump instructions.

## Rationale

- 3.4.0 is not published on npm; `-format` flag is supported in ~5.1.x.
- Keep CI annotations when available; remain compatible otherwise.
