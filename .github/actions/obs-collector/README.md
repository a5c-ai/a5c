Observability Collector (composite action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

Usage:

- name: Observability collector
  if: always()
  uses: ./.github/actions/obs-collector
  env:
    OBS_FILE: observability.json
    CONCLUSION: ${{ job.status }}
