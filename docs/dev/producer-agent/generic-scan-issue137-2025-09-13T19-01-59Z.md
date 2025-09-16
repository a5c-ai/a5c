# Producer – Generic Scan Results (Issue #137)

## Summary of Current State

- Specs present and detailed: `docs/specs/README.md`, NE schema at `docs/specs/ne.schema.json`, technical specs scaffolded under `docs/producer/phases/technical-specs/*`.
- CLI implemented with `normalize`, `enrich`, and `mentions`. Basic tests pass (`npm test`).
- GitHub enrichment implemented in `src/enrichGithubEvent.js` with owners resolution, commits/files, and branch protection; wired via `handleEnrich`.
- Redaction utilities exist and are used for CLI output.
- Phase tracking indicates Specification Phase.

## Gaps vs. Specs

1. Mentions in code comments and file changes
   - Spec calls for scanning code comments and changed files for `@agent` mentions; current implementation only scans PR title/body, commit messages, and issue comments. No code-comment/file scanning yet.

2. Composed events and rule engine scaffold
   - Spec section 6.1 references rule engine and composed events (`enrich --rules`), but implementation stores `rules` path only into metadata. No evaluation or composed outputs.

3. CLI UX flags consistency
   - Spec lists flags like `--select`, `--filter`, and `--label`. `normalize` supports `--label` but lacks `--select` and `--filter`; `enrich` lacks `--select` filter and selection. Examples in specs reference these.

4. Token precedence and env probing
   - Spec emphasizes token precedence and Actions env awareness. Config reads `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`, but workflows/docs on precedence may need tests/docs enforcement.

5. Performance and limits
   - Defaults implemented (commitLimit=50, fileLimit=200). Need tests to cover include_patch false/true flows and large diffs behavior per spec.

6. Phase checklist sync
   - Specification Phase checklist exists but not fully synced to current code/tests; needs update and possibly move to next phase when criteria met.

## Proposed Issues

- [Producer] Mentions – Add code comment and changed-files scanning
  - Description: Extend extractor to parse code comments (language-aware heuristics) and integrate into enrich pipeline when files are available from PR/push enrichment.
  - Acceptance Criteria:
    - New extractor mode scans code diffs (filenames, patches) with comment-aware regex for js/ts/md/yaml.
    - `enriched.mentions[]` includes items from code comments with `source="code_comment"` and `location` path:line.
    - Tests include PR fixture with @mentions in comments.
  - Labels: producer, functionality, backend, mentions, testing

- [Producer] Rules – Evaluate rules and produce composed events
  - Description: Implement a minimal rule engine to evaluate `--rules` (yaml/json) and produce `output.composed[]` per spec Section 6.1.
  - Acceptance Criteria:
    - Support simple match on `type`, `labels`, and `enriched.github.pr.mergeable_state`.
    - Emit composed events `{ key, targets[], criteria }`.
    - Unit tests validate two example rules from specs.
  - Labels: producer, backend, functionality, specs, testing

- [Producer] CLI – Add --select and --filter
  - Description: Add field selection and basic JMESPath-like or dot-path filter to `normalize` and `enrich` commands as per examples.
  - Acceptance Criteria:
    - `--select` outputs only selected fields when used.
    - `--filter` drops output unless expression matches.
    - Tests cover both commands with selections.
  - Labels: producer, enhancement, cli, testing

- [Producer] Docs/Tests – Token precedence and redaction examples
  - Description: Document and test token precedence (A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN) and verify redaction in CLI outputs.
  - Acceptance Criteria:
    - Tests for config precedence.
    - Docs page in `docs/producer/phases/technical-specs/integrations/github-actions.md` updated with env precedence and masks.
  - Labels: producer, documentation, testing, security

- [Producer] Phase – Sync specification checklist and transition criteria
  - Description: Update `docs/producer/phases/specification-phase/checklist.md` with current status and define criteria to move to Development Phase. If checklist is satisfied, update `current-phase.txt`.
  - Acceptance Criteria:
    - Checklist reflects current code; items checked or created.
    - If ready, `current-phase.txt` set to Development Phase and a new checklist added.
  - Labels: producer, specs, documentation

By: producer-agent (https://app.a5c.ai/a5c/agents/development/producer-agent)
