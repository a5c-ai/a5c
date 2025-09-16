# Clarify mentions.languages: codes vs extensions

Priority: low priority
Category: documentation

Context: PR #649 updates specs §5 and lists `mentions.languages` as an "optional allowlist of file extensions" with examples: `ts,tsx,js,jsx,py,go,yaml`.

Observation: The CLI reference documents `mentions.languages` using canonical language codes (e.g., `js,ts,py,go,yaml`) and notes that extensions like `.tsx` and `.jsx` are normalized to codes during detection, while the filter list itself compares codes.

Why it matters: Saying "file extensions" and including `tsx/jsx` may suggest users should pass extensions; in practice, passing canonical codes is the most predictable behavior. Detection maps `tsx`→`ts` and `jsx`→`js`, but the filter comparison uses codes.

Suggested tweak (non-blocking):

- Rephrase to: "optional allowlist of canonical language codes to scan (e.g., `ts,js,py,go,yaml`). Extensions like `.tsx` and `.jsx` map to `ts` and `js` automatically during detection."

Proposed edit in `docs/specs/README.md` §5:

```diff
- `mentions.languages`: optional allowlist of file extensions to scan (e.g., `ts,tsx,js,jsx,py,go,yaml`). When omitted, language/extension detection is used.
+ `mentions.languages`: optional allowlist of canonical language codes to scan (e.g., `ts,js,py,go,yaml`). When omitted, detection is used. Note: extensions like `.tsx` and `.jsx` map automatically to `ts` and `js` during detection.
```

Validation links:

- CLI reference: `docs/cli/reference.md#events-enrich` (Mentions scanning flags and mapping note)
- Tests: `tests/mentions.flags.e2e.test.ts` and README "Mentions scanning examples"
