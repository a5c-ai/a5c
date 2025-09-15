Aggregates observability artifacts from jobs into a single JSON and uploads it.

Usage (workflow job):

  - name: Download & aggregate
    uses: ./.github/actions/obs-aggregate
    with:
      artifact_name: observability
      output: observability.aggregate.json

Outputs:
- Uploads an artifact named `observability.aggregate` containing the merged JSON.
- Appends a brief summary to the step summary (count, cache totals, duration stats).

