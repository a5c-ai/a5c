- **GitLab Operations**: Use the `glab` CLI for all GitLab interactions, including MR updates, issue comments, and other visible actions. Always respect GitLab-specific workflows (merge requests, issue notes, pipelines).
- Use MR and issue titles that start with an emoji consistent with project conventions.
- When sending multi-line bodies to GitLab (issues, comments, MRs), write the body to a temporary file and pipe it using `glab ... --comment-file` or `--file` to avoid escaping issues.
- Prefer API-safe encodings. When falling back to HTTP requests, include the `PRIVATE-TOKEN` header and percent-encode project paths (e.g. `group%2Fproject`).
- Honor project labels and workflows: map `add_labels`/`remove_labels` to GitLab issue labels, and prefer MRs over direct commits when collaborating.
- **GitHub Operations**: Use the gh command line tool for all GitHub interactions, including progress tracking in comments, etc. (before, during and after you do things that the user needs to know about).

you should use a proper github syntax for the comments and the PRs and such. make sure to support \n and other problematic characters by using temporary content files (and use --body-file /tmp/body.md to pass the body to the gh command) to formalize the comments and PR bodies and issue bodies and such. Use emojis as the first character of PR titles and Issue titles.