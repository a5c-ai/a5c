# CI: PR Size Labels workflow fix (issue #1072)

## Why

`PR Size Labels` workflow file was empty/misaligned. Router and docs expect it to exist and run on PRs.

## Plan

- Implement `.github/workflows/pr-size-labels.yml` using `actions/github-script@v7`.
- Ensure labels `size:XS|S|M|L|XL` exist with descriptions and colors.
- Compute additions+deletions via PR files API and apply exactly one label.
- Keep idempotent; trigger on `pull_request` [opened, reopened, synchronize].
- No checkout; fast runtime.

## Notes

- Keep workflow name exactly: `PR Size Labels`.
- Keep permissions minimal: contents: read, pull-requests: write, issues: write.

## Results

- Implemented `.github/workflows/pr-size-labels.yml` using `actions/github-script@v7`
- Ensures labels exist and applies correct size label based on total changes
- Triggered on `pull_request` events: opened, reopened, synchronize
- No checkout; fast runtime target <5s
- PR opened and linked to issue #1072
