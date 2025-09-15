Observability Collector (composite action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

Usage:

- name: Observability collector
  if: always()
  uses: ./.github/actions/obs-collector
  with:
  node-version: 20 # optional, default 20
  env:
  OBS_FILE: observability.json
  CONCLUSION: ${{ job.status }}
