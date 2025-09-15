# [Validator] [Refactoring] Align Node version between matrix and setup-node

### Context

- File: `.github/workflows/main.yml`
- The `build` job defines a matrix with `node-version: [22]`, but the subsequent `actions/setup-node@v4` step installs `node-version: 20` with `check-latest: true`.

### Why it matters

- Divergent Node versions can mask issues locally in the matrix (declared intent) vs what actually runs in the job.
- Tooling caches (npm) and transitive dependency trees can differ across major Node versions.

### Recommendation

- Choose a single intended Node version for this workflow and align both the matrix and the `setup-node` step to it. Options:
  - Prefer Node 22 across both if the codebase is verified on 22; or
  - Downgrade the matrix to 20 if 20 is the supported baseline.
- If multi-version testing is desired, expand the matrix (e.g. `[20, 22]`) and reference `${{ matrix.node-version }}` in `setup-node`.

### Acceptance

- `main.yml` shows a consistent Node version selection mechanism, and CI logs reflect that version.
