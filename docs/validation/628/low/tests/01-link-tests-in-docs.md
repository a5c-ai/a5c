# Link E2E mentions flags test in docs

Non-blocking improvement: README mentions flags examples but does not point to the new end-to-end test exercising `mentions.scan.changed_files`, `mentions.max_file_bytes`, and `mentions.languages` behaviors.

- Add a short note under README “Mentions config” linking to `tests/mentions.flags.e2e.test.ts` for discoverability.
- This improves traceability from docs to executable specs.

Priority: low
