# CI – align workflows with branch policy (issue #53)

## Plan
- Validate branches and current workflow triggers
- Update Build to run on PRs (quick checks) and push to a5c/main + main
- Update Deploy to push on release/* only (plus a5c/main/main if needed?)
- Ensure a5c router listens to Build/Deploy workflow_run events
- Document rationale and open PR

## Notes
- Primary branch: a5c/main (dev, staging env)
- Production branch: main
- Release branches: release/*
