# CI: npm pack smoke

## Summary
Add a packaging smoke test that packs the repo (`npm pack`) and validates the produced tarball via `npx -y -p file:./<pkg.tgz> events` to catch missing files/bin wiring regressions.

## Plan
- Create `scripts/pack-smoke.sh` to:
  - Build the project
  - Pack to a tarball with `npm pack --json`
  - Run `events --version` and minimal end-to-end via `npx -y -p file:./$PKG`
- Update workflows:
  - `.github/workflows/quick-checks.yml`: add a fast pack-smoke step
  - `.github/workflows/tests.yml`: add pack-smoke after CLI smoke

## Notes
- Keep it quick; reuse build where available
- Avoid devDependencies in the tarball execution path

## Progress
- [ ] Script added
- [ ] quick-checks.yml updated
- [ ] tests.yml updated
- [ ] Local verification
- [ ] PR ready for review

