# [Validator] [Documentation] - Spec note for issue/check_run mapping

### Context

New event types supported: `issue`, `check_run`. Ensure docs/specs mention minimal normalized fields used here:

- `type`, `id`, `occurred_at`, `repo`, `ref` (where applicable), `actor`, `provenance.source`.

### Suggested docs improvements

- Add a short subsection in `docs/specs/README.md` (or relevant spec doc) enumerating GitHub `issue` and `check_run` mapping specifics and example minimal payloads.

### Priority

low priority
