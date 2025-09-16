# Task: Composite action - observability collector (Issue #332)

## Scope

- Create composite action `.github/actions/obs-collector` to gather job + coverage + timings
- Output JSON `observability.json`, append to step summary, upload artifact
- Integrate into `.github/workflows/tests.yml` with minimal env
- Keep primary branch model: target `a5c/main`, add workflow to `a5c.yml` list if needed

## Plan

1. Scaffold composite action (inputs/env, bash + node snippets)
2. Update tests workflow to use new action
3. Validate locally via scripts and build
4. Open draft PR linked to issue #332

## Notes

- Prefer built-in env (GITHUB\_\*) and auto-discover coverage
- Keep action self-contained; rely on actions/upload-artifact@v4
