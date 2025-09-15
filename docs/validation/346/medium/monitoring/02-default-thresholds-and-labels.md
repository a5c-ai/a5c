# Default thresholds and labels examples

Priority: medium
Category: monitoring

- Document suggested defaults: job p95 > 10m; test retry rate > 2%; cache hit < 70%.
- Provide an Actions snippet to comment on PRs and add `ci-failing` label when thresholds breached.
- Add a mapping table example: signal -> action (comment, label, issue, assignee).

Rationale: Concrete defaults speed up consistent adoption and keep MVP actionable.

