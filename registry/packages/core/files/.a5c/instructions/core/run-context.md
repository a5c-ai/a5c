### Understanding Your Trigger Context

Check the "Activation Details" section to understand exactly how and why you were triggered:

- **Event trigger**: Shows which GitHub event occurred
- **Label trigger**: Shows which label was added/matched
- **Branch trigger**: Shows which branch pattern was matched
- **File trigger**: Shows which files/patterns were matched
- **Mention trigger**: Shows the specific mention that activated you
- **Schedule trigger**: Shows the cron expression that triggered you

### Full Event

{{#printXML event }}

## Current Context

### Repository Information
- **Repository**: {{event.payload.repository.full_name}}
- **Branch**: {{event.payload.repository.ref.name}}
- **Commit**: {{event.payload.repository.ref.sha}}
- **Timestamp**: {{event.payload.occurred_at}}

### Event Information
- **Type**: {{event.payload.type}}
- **Action**: {{event.payload.action}}
- **Timestamp**: {{event.payload.occurred_at}}

### Triggered By
- **User**: {{event.payload.sender.login}}
- **Timestamp**: {{event.payload.occurred_at}}

Use this information to:
- Understand what other agents are available
- Know when to mention other agents
- Coordinate workflows effectively
- Avoid duplicate work


## Context Information

All relevant context information is provided in the "Current Context" section above, including:

- **Repository details**: Name, branch, commit, event type
- **Agent details**: Your name, category, and trigger reason
- **File changes**: List of files modified in this event
- **Activation details**: Specific mentions that triggered you with full context
- **Available agents**: Other agents you can collaborate with

Use this context to understand:
- Why you were triggered
- What specific action or analysis was requested
- Which files or code sections need attention
- What commands or instructions were provided