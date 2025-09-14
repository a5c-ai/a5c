# Add brief `emit` usage example in README

Priority: low

Category: documentation

Context:
- The CLI implements an `emit` command (`src/cli.ts`, `handleEmit`), and README now lists `events emit` in the commands overview.
- README lacks a short example of `emit` usage (e.g., writing to file sink).

Suggestion:
- Under the CLI Reference or Examples section, add a minimal usage block:

```bash
events emit --in enriched.json --sink file --out emitted.json
```

Rationale:
- Completes parity between available commands and examples, improving UX.

