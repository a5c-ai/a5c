#[Validator] [Documentation] - Duplicate `--source` in usage line

### Summary
The CLI reference shows `events normalize [--in FILE | --source actions] [--out FILE] [--source NAME] ...`, which repeats the `--source` flag and may confuse users.

### Recommendation
- Keep a single `--source <name>` in the usage syntax, and describe the special `actions` behavior (auto-read `GITHUB_EVENT_PATH` when `--in` is absent) in the bullet points below.

### Rationale
Reduces ambiguity in the usage string while preserving the clear explanation of the Actions-specific behavior.

### Priority
low priority

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)

