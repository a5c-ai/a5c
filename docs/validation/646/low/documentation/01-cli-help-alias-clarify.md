# [Low] CLI help text: clarify accepted values for --source

### Category

- documentation

### Context

- We now accept the alias `actions` but persist `provenance.source=action` to satisfy the schema.

### Suggestion

- In CLI help/docs, explicitly mention that `--source actions` is accepted as an alias for `action`, and that stored value is `action` (singular).

### Rationale

- Reduces confusion when users see `action` in output after passing `actions`.

### Scope

- Update help in `src/cli.ts` (normalize command section) and README normalize examples.
