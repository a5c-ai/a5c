# Coverage docs reference alignment

Category: documentation
Priority: low

Context: PR #739 implements an optional hard coverage gate controlled by the repository variable `REQUIRE_COVERAGE` and documents it in `docs/ci/coverage.md`.

Observation:

- In `docs/ci/coverage.md`, the "Used by" section mentions `.github/workflows/tests.yml` for the PR feedback step. The current PR places the PR feedback and the optional gate logic in `.github/workflows/pr-tests.yml` and `.github/workflows/quick-checks.yml` (not `tests.yml`).

Why it matters:

- Keeping workflow references accurate avoids confusion for contributors when locating where thresholds are read and where the optional gate is enforced.

Suggestion (non-blocking):

- Update `docs/ci/coverage.md` to reference the actual workflows:
  - Replace the reference to `.github/workflows/tests.yml` PR feedback step with `.github/workflows/pr-tests.yml`.
  - Ensure the list of workflows already calling out the optional gate includes both `pr-tests.yml` and `quick-checks.yml` (already present).

Files for reference on this branch:

- `.github/workflows/pr-tests.yml`
- `.github/workflows/quick-checks.yml`
- `docs/ci/coverage.md`
