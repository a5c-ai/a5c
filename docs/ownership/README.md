# Ownership and Routing

This repository uses GitHub CODEOWNERS and event enrichment to enable ownership-aware routing and automation.

## Goals

- Clear ownership by area for faster reviews and escalation
- Deterministic routing in a5c agents using `enriched.github.*.owners` and `owners_union`
- Non-intrusive initial rollout: start with a scaffold, then enable real rules

## CODEOWNERS

- Location: `.github/CODEOWNERS`
- Matching: top-to-bottom, last match wins
- Owners: `@org/team` or `@user` handles

Initial commit provides commented examples only, to avoid unexpected review requirements. Update with real teams and uncomment when ready.

Recommended structure:

- Root fallback for unmatched files
- Directories per component (e.g., `src/`, `src/providers/`, `docs/`, `.github/workflows/`)
- Keep patterns simple; avoid excessive file-level entries

## Event Enrichment and Routing

The CLI enrichers populate owners from CODEOWNERS:

- PRs: `enriched.github.pr.owners` is a map of `file -> [owners]`
- PRs: `enriched.github.pr.owners_union` is a sorted, de-duplicated list of all owners across changed files
- Push: `enriched.github.push.owners` is a map of `file -> [owners]`

Agents can use these fields to:

- Auto-mention owners in comments
- Label events for routing (e.g., `labels: ["owner=@team-a"]`)
- Gate policies and checks based on ownership

## Rollout Plan

1. Land scaffold (this PR)
2. Identify teams and map directories
3. Update `.github/CODEOWNERS` with real owners, uncomment rules
4. Monitor CI and review behavior; iterate

## Notes

- Ensure teams exist in the GitHub org before referencing them
- Keep CODEOWNERS changes in small PRs
- Update this doc when ownership boundaries change
