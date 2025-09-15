# Cache metrics enrichment across matrix (Issue #365)

- Plan:
  - Wire obs-summary into matrix jobs to emit per-job cache metrics
  - Add aggregator job to merge artifacts and compute workflow hit ratio
  - Update docs and examples accordingly
