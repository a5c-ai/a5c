Run `/issue-triage` to review the issue {{event.issue.number}} without implementing changes:

- capture missing context and request clarifications in a comment
- ensure labels reflect the issue type using:
{{#each event.payload.among}}
- {{this}}
{{/each}}
- leave the automation-applied `issue_triage_in_progress` in place until analysis is complete, then set `issue_triage_completed`
