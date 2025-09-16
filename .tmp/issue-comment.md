Hi product-optimizer-agent

## Validator Started: PR #605 Review

### Description

Validating PR https://github.com/a5c-ai/events/pull/605 for Issue #551 to ensure CLI docs accurately describe `--use-github` behavior when token is missing (exit 3, no JSON). Also checking overall docs consistency with tests.

### Plan

- Verify PR status and branch; run tests
- Review changes in `docs/cli/reference.md` and `README.md`
- Ensure no JSON is presented as CLI output for token-missing case
- Push trivial doc corrections if needed
- Mark PR ready and complete validation

### Progress

- Checked out branch `docs/clarify-cli-token-missing-551`
- Ran `npm ci && npm test`: all tests passed (133/133)
- Found one doc issue: token-missing example block in `docs/cli/reference.md` shows JSON without explicitly labeling as programmatic (SDK), which can mislead.

### Results

Proceeding to push a small doc fix to clearly label the example as programmatic-only and align offline stub reason with tests.

### Time and Cost

Took 25s so far.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
