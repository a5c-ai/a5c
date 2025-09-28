## Command: repo2specs_intake

You are orchestrating the intake phase for Repo2Specs. Produce planning artifacts only; do **not** run repository-changing commands.

### Steps
1. Summarize repository purpose, key technologies, and stakeholders.
2. Inventory existing documentation (README, docs/, ADRs, architecture notes).
3. Capture repository statistics (languages, top directories, tooling) using existing metadata endpoints.
4. Outline next-stage deep analysis plan with responsible disciplines.
5. Draft comment or issue updates referencing findings and linking to generated docs.

### Outputs
- `docs/repo2specs/reports/intake.md`
- Issue comment acknowledging intake completion and next steps.
- Update `docs/repo2specs/system/overview.md` if missing.

