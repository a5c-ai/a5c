# [Low] Observability JSON: add start time and duration

Currently `started_at` is `null`. Capture start time and compute duration if feasible (e.g., accept `STARTED_AT` env from earlier step or derive within job), so downstream analytics can chart timings.
