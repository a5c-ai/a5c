## [Low] Documentation - OTEL bootstrap guidance clarity

Context: `docs/observability.md` provides an example that globally installs OTEL packages and starts a NodeSDK in a one-off step. While valid for illustration, some environments prefer local devDeps (e.g., via a setup script) and using `node --import` hooks.

Suggestion: Consider adding an alternative snippet that:

- Installs `@opentelemetry/api` and SDK as devDependencies in the repo’s workflow context, and
- Boots the SDK via a tiny local script (checked in) or `node --import` flag to avoid globals.

Non-blocking; current docs are sufficient for enabling spans.
