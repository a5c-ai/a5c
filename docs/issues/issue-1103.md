docs coverage scan

Description

Add a minimal, fast docs coverage scan that reports how many Markdown files exist under docs/ and lists missing or empty files. Provides a simple JSON report for CI and a readable summary for PR comments.

Command (initial skeleton)

- npm script: `npm run docs:coverage`
- Implementation: `scripts/docs-coverage.cjs`
- Output: prints JSON with `{ total, nonEmpty, empty, files: [...] }` to stdout; exit code 0

Plan

- Implement a small Node script that walks docs/, filters \*.md, detects empties
- Add npm script wiring
- Use GH Action (separate change) to post summary and archive JSON if needed

Notes

- This is a minimal baseline to unblock automation; can be extended later to map source modules → docs pages and compute richer coverage metrics.

Results

- Script added and wired under npm: `docs:coverage`
