# Commit Hygiene: soften failure on main PRs

- Context run: https://github.com/a5c-ai/events/actions/runs/17793060943
- Failure: strict Conventional Commits rejected emoji-leading commit in PR range.
- Plan: make PR-title check non-blocking (already), and treat commits to main as advisory (soft-fail with summary) while keeping a5c/main strict.
