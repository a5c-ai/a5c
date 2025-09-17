# CI: fix emit.basic.test default sink

- Context: workflow run 17794968319 failed due to test expecting default stdout, but code now defaults to 'github' sink when no --out.
- Change: update tests/emit.basic.test.ts to set `sink: "stdout"`.
- Verification: npm test now passes (62 files, 162 tests).
- Links: https://github.com/a5c-ai/events/actions/runs/17794968319
