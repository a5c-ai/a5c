# Optional coverage gate – validator notes

- Gate is conditioned on \.
- Uses scripts/coverage-thresholds.json as single source.
- Writes table to /home/runner/work/\_temp/\_runner_file_commands/step_summary_94ef2103-7514-4a6c-ac0a-2f35f22ff2e2; PR feedback labels/comments remain.
- Quick checks and PR tests both include the gate with identical logic.

Non-blocking suggestions:

- Consider DRYing the bash/Node snippets into a scripts/coverage-gate.sh to avoid duplication across workflows.
- Add a brief README in scripts/ about maintaining coverage-thresholds.json.
