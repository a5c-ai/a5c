# README: Inline provider in offline example

- Category: documentation
- Priority: low

Context: README Behavior section mentions offline result includes `partial=true` and `reason: "flag:not_set"` but does not explicitly show `provider: "github"` in that one-liner.

Suggestion:

- Add a tiny JSON snippet mirroring CLI reference, e.g.:
  ```json
  {
    "enriched": {
      "github": {
        "provider": "github",
        "partial": true,
        "reason": "flag:not_set"
      }
    }
  }
  ```

Rationale:

- Keeps README self-contained without needing to jump to CLI reference for exact shape.
