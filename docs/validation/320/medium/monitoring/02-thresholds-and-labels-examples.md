# Add concrete thresholds and label automation examples

Priority: medium
Category: monitoring

- Provide initial default thresholds in docs (e.g., job p95 > 10m, test retry rate > 2%, cache hit < 70%).
- Show YAML snippet for PR comment + adding `ci-failing` label when thresholds are exceeded.
- Include mapping table: signal -> action (comment, label, issue, assignee).

Rationale: Concrete examples accelerate implementation and keep MVP consistent across repos.
