#+ [High] Workflow robustness - Ensure gh CLI on self-hosted runner

Category: deployment

Context: `.github/workflows/main.yml` adds a "Step hotspots summary" step to job `test` which runs on a self-hosted runner `runner8core`. The script `scripts/ci-step-hotspots.cjs` relies on the GitHub CLI (`gh`). While `gh` is present on `ubuntu-latest`, it may not be installed on the self-hosted runner.

Risk: The hotspots step may degrade (emit a warning and skip analysis) due to missing `gh`, reducing observability signal.

Recommendation:

- Add an installation/validation step for `gh` in self-hosted environments, or refactor to use Octokit via `actions/github-script` to avoid the external CLI.
- Example snippet (Linux):
  ```yaml
  - name: Ensure GitHub CLI
    if: runner.os == 'Linux'
    run: |
      if ! command -v gh >/dev/null 2>&1; then
        type -p curl >/dev/null || sudo apt-get update
        type -p curl >/dev/null || sudo apt-get install -y curl
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt-get update && sudo apt-get install gh -y
      fi
  ```
