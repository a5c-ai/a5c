# Issue 108 – Mentions: code comments scanning

Started: Sat Sep 13 17:19:11 UTC 2025

Plan:

- Add language-aware scanners for comments in changed files (PR/push).
- Enforce max bytes and language filters.
- Record location {file,line} and context.
- Wire into handleEnrich using enriched.github.pr.files/push.files.
- Add unit tests with fixtures across languages.
