# Windows-safe filenames in docs

Avoid colons (`:`) or other Windows-invalid characters in filenames.
Prefer timestamps like `YYYYMMDD-HHMMSSZ` or `2025-09-13T185841Z` with `:` replaced by `-`.

- Bad: `generic-scan-issue137-2025-09-13T18:58:41Z.md`
- Good: `generic-scan-issue137-2025-09-13T18-58-41Z.md`

Pre-commit will block staging files that include `:` in their names.
