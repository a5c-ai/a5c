# [Validator] [Documentation] - CLI version string mismatch

- Priority: low
- Category: documentation

## Summary
The CLI reports version `0.1.0` in `src/cli.ts` via `program.version('0.1.0')`, while `package.json` version is `1.0.0`. This can confuse users and scripts that rely on `events --version`.

## Recommendation
Read the version dynamically from `package.json` at runtime (using `resolveJsonModule` with a small wrapper, or reading the file relative to project root) or set a single source of truth and inject during build.

## Suggested Follow-up
- Implement a small utility `getVersion()` and use it in the CLI.
- Ensure `package.json` is included if needed, or embed the version at build time.
