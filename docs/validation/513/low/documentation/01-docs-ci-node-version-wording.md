Title: CI docs phrasing about Node version setup
Priority: low
Category: documentation

Summary
- README mentions overriding Node via `with.node-version`, while most workflows now use `node-version-file: .nvmrc` by default. Wording can better reflect `.nvmrc` as the primary source of truth and mention override as an exception.

Details
- File: README.md (CI Observability and Node version sections)
- Suggest updating phrasing to: "actions/setup-node@v4 uses `node-version-file: .nvmrc` by default in our workflows; override `with.node-version` only when a job requires a different Node version (e.g., the Typecheck matrix)."

Suggested Fix
- Minor copy update only. No behavior change.

