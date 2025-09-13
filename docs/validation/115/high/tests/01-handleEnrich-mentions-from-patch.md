Title: Add integration test for handleEnrich to include code_comment mentions from GitHub patch data

Category: tests
Priority: high

Context
- PR #115 implements scanning code comments in changed files via patch content in `handleEnrich`.
- Unit tests cover the scanner (`scanMentionsInCodeComments`) but not the `handleEnrich` wiring path.

Problem
- Missing integration test for `handleEnrich` to ensure mentions from `enriched.github.pr.files[].patch` (or `push.files`) are propagated to `enriched.mentions` with `source: 'code_comment'`.

Proposal
- Add a vitest case exercising `handleEnrich` with a synthetic GitHub-enriched payload stub containing a `files` entry with a `patch` that includes a comment mention.
- Assert that the output contains a `Mention` with the correct `normalized_target`, `source: 'code_comment'`, and `location.file`.

Acceptance Criteria
- Test fails without the enrichment wiring and passes with current implementation.
- Covers both PR and push file shapes if feasible.

Notes
- Keep test small and independent of network calls. Stub enrichment result directly or mock `enrichGithubEvent` import.

