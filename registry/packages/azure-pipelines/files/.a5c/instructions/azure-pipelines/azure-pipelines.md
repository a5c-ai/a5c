- **Azure DevOps Operations**: Use the `az pipelines` and `az repos` CLI (or `az devops`) for Azure DevOps interactions when possible. For REST fallbacks, set `AZURE_DEVOPS_EXT_PAT` and target the organization's DevOps URL.
- Ensure pipeline names, branch policies, and service connections follow the project's conventions.
- Use YAML pipeline definitions stored under `.azure-pipelines/` when seeding or updating automation.
- When posting comments or status updates, use `az repos pr comment` and `az boards work-item update` to keep history centralized.
- Always respect approvals and required checks before completing pull requests.

