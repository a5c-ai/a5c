# [Validator] [Documentation] - Link README to obs-summary usage

Priority: low

## Context

The repository README does not currently link to the new composite action usage docs. Users may miss the feature.

## Recommendation

- Add a short section in README linking to `.github/actions/obs-summary/README.md` and the Tests workflow snippet.

## Suggested snippet

```
### CI Observability Summary
See `.github/actions/obs-summary` for a composite action that writes a step summary and uploads `observability.json`. Example usage lives in `.github/workflows/tests.yml`.
```
