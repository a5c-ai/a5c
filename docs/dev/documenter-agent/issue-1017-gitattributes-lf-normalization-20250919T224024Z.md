# Issue 1017: Add .gitattributes for LF normalization — docs update

## Summary
Add `.gitattributes` at repo root to enforce LF normalization across platforms and reduce spurious diffs. Update `CONTRIBUTING.md` with a brief section on line endings and Windows guidance.

## Context
- Base branch: `a5c/main`
- Related issue: #1017
- Current files of interest: none for `.gitattributes` (missing), `CONTRIBUTING.md` (to be updated)

## Plan
1. Add `.gitattributes` with:
   - `* text=auto eol=lf`
   - Lockfiles explicitly LF: `package-lock.json text eol=lf`, `yarn.lock text eol=lf`, `pnpm-lock.yaml text eol=lf`
   - Scripts: `*.sh eol=lf`
   - Treat common binary formats as binary: `*.png binary`, `*.jpg binary`, `*.jpeg binary`, `*.gif binary`, `*.webp binary`.
   - Optional linguist-generated markers for `dist/`, `coverage/`
2. Update `CONTRIBUTING.md` with a short section on line endings behavior and Windows setup notes.
3. Commit and open a draft PR linking to #1017.
4. Finalize PR and request validation.

## Notes
- Keep scope minimal and focused on attributes and contrib docs only.


## Implementation Results
- Added `.gitattributes` with LF normalization, binary patterns, and linguist markers.
- Updated `CONTRIBUTING.md` with line endings policy and Windows configuration tips.
- Opened PR #1032 (now ready for review) that fixes #1017.

## Next Steps
- Await @validator-agent review and CI.
