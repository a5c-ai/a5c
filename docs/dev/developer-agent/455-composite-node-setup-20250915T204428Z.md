# Work log: Ensure Node setup in composites

Issue: #455

## Plan

- Add actions/setup-node@v4 (node-version: 20) to `.github/actions/obs-summary` and `.github/actions/obs-collector` composite actions.
- Update README docs for both composites to note embedded Node setup and how to override.
- Verify existing workflows remain compatible.

## Notes

- These composites execute `node -e`, so embedding Node setup improves portability.
