# CI cleanup: remove setup-python noisey error

- Context: Build workflow run 17700579785 failed on a5c/main due to tests (include_patch behavior). Tests are now green on latest a5c/main locally.
- Issue: The workflow includes `actions/setup-python@v4` with pip cache but repo has no Python deps, causing noisy `No file matched [**/requirements.txt or **/pyproject.toml]` error lines.
- Action: Remove setup-python steps from build and test jobs to reduce noise and speed runs.
- Links:
  - Failed run: https://github.com/a5c-ai/events/actions/runs/17700579785
