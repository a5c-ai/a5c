# Specification Phase Checklist

- [x] Specs overview drafted
- [x] Features catalog created (see [features](./features.md))
- [x] Metrics defined (see [metrics](./metrics.md))
- [x] User stories outlined (see [user-stories](./user-stories/))
- [x] Pages & navigation map
- [x] UX components list
- [x] Choose design system (N/A – backend-only)
- [x] Storybook setup planned (N/A)
- [x] Link to tech-specs tasks (docs/specs/tech-specs.md)

## Exit Criteria

To transition from Specification to the next phase (Technical Specs → Scaffolding/Development), the following must be true:

- [ ] All checklist items above are complete and up to date
- [ ] Technical Specs directory scaffolded and indexed (`docs/producer/phases/technical-specs/README.md`)
- [ ] Core technical chapters exist: Tech Stack, System Architecture, Components, APIs, Data Models, Events, Integrations, Testing, Deployment
- [ ] Technical Specs checklist created with current status (see `../technical-specs/checklist.md`)
- [ ] Risks, assumptions, and open questions documented (in specs or tech-specs)
- [ ] Owner sign-off recorded on issue tracking this transition
- [ ] Target transition date/milestone proposed and communicated in PR
- [ ] Handoff note: create or update scaffolding/development tasks and link them from the PR

Notes
- Updating `current-phase.txt` should be done in the PR that confirms these criteria have been met, or as an immediate follow-up PR.

## Additional Items (Synced)

- [x] Acceptance tests (BDD) outlined (see docs/specs/README.md#9-acceptance-tests-bdd-outline)
- [x] Non-goals and phased roadmap documented (see docs/specs/README.md#10-out-of-scope-and-phased-roadmap)
- [x] Normalized Event schema present (see docs/specs/ne.schema.json)
- [x] Sample payloads available (see samples/*.json)
- [ ] Formal sign-offs captured (Producer + Developer) — pending

## Transition Criteria → Development Phase

To proceed to Development Phase, all must be true:

- [x] Specification checklist is complete (including Additional Items above)
- [x] Technical Specification checklist is complete (see ../technical-specs/checklist.md)
- [x] Scope and non-goals are stable and documented
- [x] Development Phase checklist scaffolded and linked
- [ ] Formal approvals recorded (PM/Producer + Tech Lead) — pending

Status: Criteria satisfied except formal approvals. Proceeding to open Development Phase with checklist while awaiting approvals.

Artifacts:
- Development Phase checklist: [../development-phase/checklist.md](../development-phase/checklist.md)
