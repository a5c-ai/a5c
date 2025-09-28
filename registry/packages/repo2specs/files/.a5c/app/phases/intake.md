# Intake Phase

Purpose: Collect repository metadata, align expectations, and queue the initial Repo2Specs run.

### Triggers
- `repo2specs` label added to issue or PR
- Manual command via `/repo2specs intake`

### Agent Checklist
1. Validate repository access, default branch, and active environments.
2. Gather current docs: README, CONTRIBUTING, docs/
3. Capture existing CI/CD configuration and workflows.
4. Enumerate directories by functional area (backend, frontend, infra, etc.).
5. Draft `docs/repo2specs/system/overview.md` with initial component map.
6. Create intake issue updates referencing discovered artifacts.

### Deliverables
- Intake summary at `docs/repo2specs/reports/intake.md`
- Initial issue/comment confirming scope and next phase.

