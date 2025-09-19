# Task: Add sample reactor.yaml + quickstart script — Reactor (Issue #1028)

## Plan

- Create `.a5c/events/reactor.yaml` minimal rules matching `pull_request.synchronize`.
- Add `reactor:sample` npm script running the CLI against `samples/pull_request.synchronize.json`.
- Update `README.md` with a short Quick Start and link to `docs/cli/reference.md#events-reactor`.

## Notes

- CLI bin: `events` -> `dist/cli.js` via package.json; use `node dist/cli.js` in scripts to avoid global install.
- Default reactor rules path is `.a5c/events/reactor.yaml`.

## Checklist

- [ ] Sample rules file exists.
- [ ] Script runs and prints `events` array.
- [ ] README Quick Start updated.
