Use `/pr-validate` when PR #{{event.pull_request.number}} needs validation support:

- understand the scope and expected behaviors
- run relevant checks/tests and record evidence
- keep `pr_validation_in_progress` until validation ends
- on success, comment a summary and set `pr_validation_completed`
- if issues remain, document findings and remove the queued label without completing

