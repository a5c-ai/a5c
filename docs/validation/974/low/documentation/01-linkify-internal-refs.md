Title: Linkify internal doc references in how-to
Priority: low
Category: documentation

Summary

- The how-to guide references internal docs using code spans instead of clickable links (e.g., `docs/cli/reference.md`, `docs/ci/actions-e2e-example.md`). Converting these to relative Markdown links improves UX and discoverability.

Suggested Changes

- In `docs/user/how-to.md`, replace code-span paths with `[text](../cli/reference.md)` or similar relative links.
- Keep consistency with existing docs (README and CLI reference) for command names and anchors.

Rationale

- Linkified references enable quick navigation and are standard across the repo.

Notes

- Lychee link check currently excludes code spans; making them links will include them in link checks automatically.
