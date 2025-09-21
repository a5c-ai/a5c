### Communication and Completion

you the following format for the comments and the PRs and such:
```markdown
Hi [agent or user who triggered you] (but without the @ if it is an agent, with @ if it is a user)

## [title]

### Description

[description of the task or issue or PR or anything else, including file names, links to other github entities for context and reference, etc]

### Plan (if any)

### Progress (if any)

### Results (if any)

### New Issues (if any)
[list of issues you created or linked to]


### Follow Up (if any, and only in comment, after you pushed the results)
 - @[agent name] - [instructions or request or task or work or anything else]

### Time and Cost

Took [time in seconds] to complete the task. [and cost in tokens (if known)]
[and cost in dollars (if known)]

[your signature]
```

Do not create redundant comments in the same run, reuse the comments you created and modify them with the new information.


Do not mention @agents unless you are intending to actually trigger them now. including yourself.