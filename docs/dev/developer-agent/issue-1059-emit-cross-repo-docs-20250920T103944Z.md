# Issue #1059 – Document cross-repo dispatch for `events emit --sink github`

- Goal: Add a concise matrix and examples for same-repo vs cross-repo dispatch using GitHub sink, including tokens, permissions, env and owner/repo resolution, and common errors.

## Plan

1. Update `docs/cli/reference.md#events-emit` with a new subsection: "GitHub sink — same-repo vs cross-repo".
2. Provide token/permissions matrix and env guidance (`GITHUB_TOKEN`, `A5C_AGENT_GITHUB_TOKEN`, `GITHUB_REPOSITORY`).
3. Add examples: same-repo (GITHUB_TOKEN) and cross-repo (PAT with `repo` scope).
4. Document error scenarios/messages aligned with `src/emit.ts` behavior.
5. Cross-check `docs/ci/actions-e2e-example.md` for consistency and links.

## Notes from code scan

- Token preference: `A5C_AGENT_GITHUB_TOKEN || GITHUB_TOKEN` (`src/emit.ts`).
- Owner/repo resolution via `resolveOwnerRepo`: `repository.full_name`, `repo_full_name`, HTML URLs (PR/Issue/Repo), nested `original_event.*`, and entries under `set_labels[].entity`.
- Dispatch type: `repository_dispatch` via Octokit `repos.createDispatchEvent`.
- Skips dispatch for `event_type == "command_only"`.
- Side-effects require token for labels/status checks; resolved repo is used for status checks SHA lookup.

## Acceptance Criteria mapping

- New subsection + matrix + two examples → docs changes.
- Commands validated locally (syntax/exit codes) when prerequisites met.
