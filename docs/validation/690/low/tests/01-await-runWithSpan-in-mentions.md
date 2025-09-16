## [Low] Tests - await runWithSpan in mentions action

Context: PR #690 (feat/otel-cli-spans). The CLI `mentions` command wrapped its work in `runWithSpan` but did not `await` the promise, which could theoretically allow process exit before the span `.end()` runs in certain runtimes.

Change: Updated `src/cli.ts` to make the `.action` async and `await runWithSpan(...)` for `mentions`, matching other commands’ async usage.

Rationale: Ensures deterministic completion and consistent tracing behavior when OTEL is enabled. Non-functional in no-OTEL mode but improves reliability.

Follow-up: No further action required.
