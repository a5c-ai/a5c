# [Validator] [Tests] - Extend focused guards for Jasmine aliases (non-blocking)

### Context

The new guard script `scripts/lint-tests-focused.sh` currently detects `describe/it/test .only(` and `.skip(` under `test/` and `tests/`. Some stacks also use Jasmine-style focused aliases `fdescribe` and `fit`, and occasionally skipped variants like `xdescribe` and `xit`.

### Suggestion (low priority)

- Consider extending patterns to include `\bfdescribe\s*\(` and `\bfit\s*\(` as additional focused-test guards.
- Optionally include skipped aliases `\bxdescribe\s*\(` and `\bxit\s*\(` if those are used in this codebase.
- Keep current scoping and directory exclusions to minimize false positives.

### Rationale

Catches a few more cases across different testing styles with negligible cost. This is non-blocking and can be added later if/when the need arises.
