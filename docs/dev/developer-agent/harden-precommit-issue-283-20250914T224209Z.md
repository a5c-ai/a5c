# Harden pre-commit checks — commit hygiene (Issue #283)

Initial commit setting up branch and plan.

## Plan
- Implement scripts/precommit.sh encapsulating checks and fast-fail
- Update .husky/pre-commit to delegate to script, with SKIP_CHECKS bypass
- Add CONTRIBUTING.md section for bypass and troubleshooting
- Ensure CI mirrors typecheck and keeps lint green
