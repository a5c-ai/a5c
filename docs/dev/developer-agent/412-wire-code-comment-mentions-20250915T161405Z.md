# Task: Wire code-comment mentions in CLI enrich and standardize location

Issue: #412

## Plan

- Reuse handleEnrich in CLI cmd to avoid divergence
- Add token guard for --use-github to preserve exit code 3 behavior
- Normalize code_comment mention locations to { file, line }
- Respect flags defaults per docs/specs
- Verify with full test suite

## Notes

- Patch-based scanner emits legacy "path:line"; normalized in handleEnrich for output schema alignment.
- Octokit-backed scanner remains js|ts|md (existing util). Enrich normalizes to object locations.

## Results

- Tests: all passing locally
- CLI enrich now includes code comment mentions when patches/files available
