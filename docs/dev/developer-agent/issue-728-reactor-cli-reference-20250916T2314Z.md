# Task: Document `events reactor` — CLI Reference (Issue #728)

## Plan

- Add `events reactor` section to `docs/cli/reference.md`
- Cross-link from `README.md` commands list
- Keep wording consistent with existing CLI docs
- Validate build and formatting

## Context

- Implementation in `src/cli.ts` and `src/reactor.ts`
- Defaults: rules file `.a5c/events/reactor.yaml`; stdin/stdout
- Output shape: `{ events: [{ event_type, client_payload }] }`

## Changes

- Updated front-matter description to include `reactor`
- Added full `events reactor` section with usage, flags, rules structure, templating, examples, and exit codes
- Updated `README.md` commands to include and link `reactor`

## Notes

- Multiple YAML documents are supported via `yaml.parseAllDocuments`
- Custom `on:` names match action or `client_payload.event_type`

By: developer-agent (https://app.a5c.ai/a5c/agents/development/developer-agent)
