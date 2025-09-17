# actionlint strict mode (REQUIRE_ACTIONLINT)

This repository supports an opt-in strict mode for actionlint via the environment variable `REQUIRE_ACTIONLINT`.

- Truthy values (case-insensitive): `1`, `true`, `yes`, `on`, `strict` → strict mode (fail the step on findings)
- Empty/anything else → advisory mode (do not fail the step)

Implementation lives in `scripts/ci-actionlint.sh` and is wired in `.github/workflows/quick-checks.yml`:

```
- name: Validate GitHub Workflows (actionlint)
  env:
    REQUIRE_ACTIONLINT: ${{ vars.REQUIRE_ACTIONLINT || '' }}
  run: bash scripts/ci-actionlint.sh
```

Expected logs:

- Advisory: `::notice::actionlint mode: advisory` and `::warning::actionlint found issues. Proceeding without failing CI (advisory mode).`
- Strict: `::notice::actionlint mode: strict` and `::error::actionlint found issues ... failing CI.`

The script prefers the curl-installed prebuilt binary and falls back to Docker. When neither curl nor Docker is available, it logs a skip notice and exits successfully.
