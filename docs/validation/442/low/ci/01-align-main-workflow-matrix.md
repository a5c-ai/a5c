#[Validator] [CI] - Align `main.yml` Node matrix with actual setup

Priority: low

### Context

- File: `.github/workflows/main.yml`
- Observation: The job defines a matrix `node-version: [22]` but the actual `actions/setup-node@v4` steps use `node-version: 20`.

### Why it matters

- The explicit matrix suggesting Node 22 may confuse contributors and tooling.
- Keeping a single source of truth avoids drift.

### Recommendation

- Either remove the unused matrix or align it to `20`.
- Alternatively, wire the step to use the matrix value and set it to `[20]` for clarity:

  strategy:
  matrix:
  node-version: [20]
  steps:
  - uses: actions/setup-node@v4
    with:
    node-version: ${{ matrix.node-version }}

### Acceptance

- `main.yml` reflects Node 20 clearly with no conflicting cues.
