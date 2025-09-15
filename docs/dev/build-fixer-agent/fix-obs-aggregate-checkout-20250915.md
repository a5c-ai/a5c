# Build Fix: obs-aggregate needs checkout

- Context: Failed Tests run 17736850192 shows 'Can't find action.yml' for ./.github/actions/obs-aggregate in Aggregate Observability job.
- Root cause: missing actions/checkout step in the aggregate job; local composite actions require repo checkout.
- Fix: add 'actions/checkout@v4' before using ./.github/actions/obs-aggregate.
- Related: also ensures other local composite actions are loaded if expanded later.
- Verification: Will rely on CI rerun; local file presence confirmed.

Timestamp: 2025-09-15T14:56:44Z
