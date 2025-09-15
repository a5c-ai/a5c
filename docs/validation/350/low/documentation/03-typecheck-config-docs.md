# [Validator] Documentation - Typecheck config reference

Priority: low priority
Category: documentation

Docs mention a `tsconfig.typecheck.json` variant, but the project currently uses `tsconfig.build.json` for both build and `npm run typecheck` (noEmit). While behavior (src-only) aligns, the filename reference may confuse contributors.

Suggested fix: Either adjust docs to reference `tsconfig.build.json` for typecheck, or add a dedicated `tsconfig.typecheck.json` if that separation is desired.

Files: `CONTRIBUTING.md`
