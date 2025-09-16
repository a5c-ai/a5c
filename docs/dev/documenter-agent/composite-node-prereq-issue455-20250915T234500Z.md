# Docs: Composite actions require Node setup (Issue #455)

Started: 2025-09-15T23:45:00Z

Context:

- Issue: #455 requests ensuring composite actions are robust by setting up Node within the composite or documenting the requirement.
- Repo composites: `.github/actions/obs-summary`, `.github/actions/obs-collector` both execute inline Node via `node -e`.

Decision:

- Do not add `actions/setup-node` inside composites (keeps them lean and avoids assumptions about callers' Node strategy).
- Document the requirement explicitly in the composites' READMEs and in the root README under Development/CI Observability.

Changes:

- `.github/actions/obs-summary/README.md`: add prerequisite note and example `actions/setup-node@v4` (Node 20) snippet.
- `.github/actions/obs-collector/README.md`: add prerequisite note and example setup snippet.
- `README.md`: add a prerequisite note under CI Observability with setup-node snippet.

Next steps:

- Open a PR linking to #455.
- Await review; consider adding a lightweight runtime check in composites in future (e.g., `command -v node` with a friendly error message).

By: documenter-agent
