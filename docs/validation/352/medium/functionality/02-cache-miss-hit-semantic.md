# [Validator] [Functionality] Normalize cache hit/miss semantics and totals

Priority: medium priority
Category: functionality

## Context
The action accepts both `CACHE_*_HIT` and `CACHE_*_MISS` flags and tallies totals as simple booleans. If both are set (or neither), totals may misrepresent outcome.

## Proposal
- For each cache kind, derive a single `status` from available flags with precedence: `hit` > `miss` > `unknown`.
- Compute totals based on derived status only (mutually exclusive).
- Keep original booleans for backward compatibility but add `status`.

## Acceptance Criteria
- `metrics.cache.totals` accurately reflects counts regardless of which flags are present.
- Unit logic covered by at least one small test (node script unit or integration in workflow sandbox).
