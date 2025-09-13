# [Validator] [Tests] Prefer explicit `npm ci` in Smoke workflow

The `Smoke` workflow currently relies on the shell script to install deps. For more deterministic CI and cache usage, add an explicit `npm ci` step in the workflow before running the script.

Suggested change in `.github/workflows/smoke.yml`:
- Add: `- run: npm ci --prefer-offline --no-audit --no-fund`
- Keep the script step afterwards (it will skip reinstall if lockfile exists).

Priority: medium
