# Obs Summary & Artifact (Composite Action)

Aggregates basic job metadata with optional coverage metrics, writes a human-readable step summary, and outputs `observability.json` that is uploaded as an artifact.

## Usage

```yaml
    - name: Observability summary
      uses: ./.github/actions/obs-summary
      env:
        OBS_FILE: observability.json # optional
        JOB_NAME: ${{ github.job }} # optional override
```

The action tries to read `coverage/coverage-summary.json` if present, to include coverage metrics in both the summary and the JSON.

