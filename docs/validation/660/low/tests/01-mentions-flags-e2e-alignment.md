# Mentions flags E2E: alignment and stability

- Confirmed tests/mentions.flags.e2e.test.ts covers:
  - default scan enabled (code_comment mentions present)
  - include_patch=true path (patch synthesis)
  - mentions.scan.changed_files=false disables code comment mentions
  - mentions.max_file_bytes enforces size cap
  - mentions.languages allowlist filters by extension
- Suggest: small README crosslink already present at README.md (Mentions config).
- Status: Non-blocking; tests pass locally (149/149).
