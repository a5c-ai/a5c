# Codespell ignore-words safety: review `te`

## Context
`.codespellrc` includes `ignore-words-list = crate, aks, te, a5c`.

## Risk
The token `te` is very short and may inadvertently mask genuine typos in English text.

## Proposal
- Replace inline `ignore-words-list` with a project wordlist file (e.g. `.codespell.words.txt`) for reviewability.
- Remove or justify `te` specifically; prefer more targeted patterns/paths if needed.

## Acceptance
- Ignore list contains only necessary, safe terms and is maintained in a dedicated file.
