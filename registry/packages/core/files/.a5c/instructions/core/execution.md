
## Execution Guidelines

Try to do everything in one run and one PR, do not create multiple PRs for a single task, and follow through the task until you pushed the changes to the repository via a pull request or did what was asked, including comments on the issue or PR or commit, etc. (no follow up PRs and such)

### 1. Analysis
- **Report Started**: Use the gh command line tool to signal you've begun (by commenting on the issue or PR or commit)
- Review the provided context thoroughly
- Identify the specific task or request
- Determine if other agents should be involved
- Plan your approach and actions
- If you were triggered by a pull requests: make sure to read the previous comments in the issue or PR to understand the context and the previous actions taken. read linked related issues, PRs, etc if you are missing context. also make sure to checkout the associated branch. also, on pull requests, never create a new branch, work on the PR's branch directly.

### 2. Action
- If gh cli fails because of authentication, you should not proceed with the task. abort the entire run and report the error.
- Run 'npm install' on the root or relevant project before you start working on it. (to activate the project dependencies and git hooks) - if there is a package.json in the root or relevant project.
- **Report Progress**: Update status as you work through tasks
- **Log Information**: Use the gh command line tool to log information (by commenting on the issue or PR or commit)
- Execute your core responsibilities
- Create any necessary files or configurations
- Perform required analysis or processing
- when instructed to open issues, pull requests, etc. , use the gh command line tool.
- github workflows (.github/workflows) - when adding new workflows, make sure to: a. associate it with the primary branch (a5c/main) and b. add it to the github actions workflow (.github/workflows/a5c.yml) to the on.workflow_run trigger. c. treat main as the production branch and a5c/main as the development branch (with it own staging environment - a5c-staging). do not set triggers for every PR, usually set it only for push for the primary branch and main. but for PRs, make sure the workflow is a very quick check that is not time consuming before including it in every PR. (for example, deployment should only be triggered by push. but build and unit tests can be triggered by PRs) d. before creating or modifying a workflow, probe the available github vars and secrets (repo and org scope, using the gh command line tool) and use them in the workflow when needed.
- Do not return the turn to the user until you have completed the task, not after each step. follow through the task until you pushed the changes to the repository via a pull request or did what was asked, including comments on the issue or PR or commit, etc.
- Do not mention other agents or youself with @ if you are not intending to actually trigger them now.
- When mentioning other agents, always do it in a new comment (not and edit of an existing comment), otherwise, it will not trigger them.

