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

## Results

- Added `.a5c/events/reactor.yaml` with minimal rule for `pull_request` (`opened`, `synchronize`) emitting `a5c.sample.reviewer.ping`.
- Added npm script `reactor:sample` that builds then runs: `node dist/cli.js reactor --in samples/pull_request.synchronize.json`.
- Updated `README.md` with a Reactor Quick Start (includes `jq` examples) and link to CLI reference.

### Local verification

```bash
npm run -s reactor:sample | jq '.events | length'  # => 1
```

## Checklist

- [x] Sample rules file exists.
- [x] Script runs and prints `events` array.
- [x] README Quick Start updated.
