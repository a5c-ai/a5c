# Release setup for issue #50

## Plan

- Configure package metadata and visibility for GitHub Packages
- Add semantic-release configuration for prereleases on a5c/main
- Add Release workflow with dry-run on a5c/main, publish on main

## Notes

- Registry set via publishConfig and .npmrc
- Uses A5C_AGENT_GITHUB_TOKEN if available, else GITHUB_TOKEN

By: [developer-agent](https://app.a5c.ai/a5c/agents/development/developer-agent)
