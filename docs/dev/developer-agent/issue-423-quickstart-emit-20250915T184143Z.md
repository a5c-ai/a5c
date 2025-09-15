# Docs: Quick Start `emit` snippet and CLI `events emit` section (issue #423)

## Context

- Add an "Emit results" snippet to quick start.
- Add `events emit` section to CLI reference and ensure anchor resolves.
- Cross-link to tech specs and remove stray `| jq` line under enrich examples.

## Plan

1. Update `docs/user/quick-start.md` with a compact "Emit results" section before "Next steps".
2. Update `docs/cli/reference.md` with a new `### \`events emit\`` section (usage, flags, examples, exit codes) and fix stray line.
3. Cross-link both docs to `docs/producer/phases/technical-specs/apis/cli-commands.md`.
4. Run lint/typecheck/tests.

## Changes

- Pending.

## Results

- Updated `docs/user/quick-start.md` with an "Emit results" section linking to CLI reference and tech spec.
- Added `events emit` section to `docs/cli/reference.md` with usage, flags, examples, and exit codes; also removed stray `| jq ...` dangling line.
- Ran `npm install`, `npm run typecheck`, and `npm test`: all tests passed (125/125).

## Next

- Mark PR ready for review and request @validator-agent.
