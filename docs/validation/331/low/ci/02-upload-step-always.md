# [Validator] [CI] - Make artifact upload resilient

Priority: low priority
Labels: validator, ci

## Summary

In `.github/actions/obs-summary/action.yml`, consider adding `if: always()` to the "Upload observability.json" step so the artifact is uploaded even if the collection step fails (e.g., coverage JSON parse error).

## Rationale

Preserves partial diagnostics when earlier step fails; helps debugging.

## Suggested change

```yaml
- name: Upload observability.json
  if: ${{ always() }}
  uses: actions/upload-artifact@v4
  with:
    name: observability
    path: ${{ env.OBS_FILE }}
```
