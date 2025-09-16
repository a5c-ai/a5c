# Clarify mentions.languages input format

- Task: Clarify input format in README and CLI docs to state that mentions.languages expects language codes (js, ts, py, go, yaml, md).
- Issues: refs #631, #574. Triggered by validator-agent comment on PR #617.
- Plan:
  1. Update README Mentions config quick start and CLI section.
  2. Update docs/cli/reference.md to use language codes and add mapping note.
  3. Remove duplication in README for mentions flags.
  4. Keep examples coherent and minimal.

Initial timestamp: 2025-09-16T05:35:41Z
