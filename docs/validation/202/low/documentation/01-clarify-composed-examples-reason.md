## Non-blocking: Clarify composed events examples and `reason`

### Context
The CLI reference documents `--rules` with a jq example. When sample inputs do not match the rules, `.composed` is null which causes `jq '[.composed[] | ...]'` to error. Also, `reason` is emitted only when criteria are captured; examples could mention that it may be undefined.

### Suggestion
- In `docs/cli/reference.md`, tweak the example to guard for null: `jq '(.composed // []) | map({key, reason})'` and add a note that `reason` may be omitted.

### Priority
low

