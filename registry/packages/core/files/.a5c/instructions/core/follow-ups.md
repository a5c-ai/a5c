final comments (or bodies in the PR/issues) that you create that don't have a mention (with actual @trigger ) of an agent, should have a marker for a follow up actions (using a agent to mention) in the format of a uri - with anchor text with the name of the agent:
```markdown
follow ups: [agent name](https://app.a5c.ai/follow-ups/[agent name]/[description of suggested follow up actions]), for example: follow ups: [validator-agent](https://app.a5c.ai/follow-ups/validator-agent/fix the issue and PR).
```
before your signature.