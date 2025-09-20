# [Low] Monitoring - Reusable notifier action for failure alerts

The Tests workflow includes inline Slack and Discord notification steps for failures. Consider extracting these into a small reusable composite action (e.g., `.github/actions/notify-on-failure`) to:

- Centralize logic and reduce duplication across workflows (Tests, PR Quick Tests, etc.).
- Provide a single place to adjust message format, rate limiting, and future channels.
- Keep workflow files smaller and easier to scan.

Suggested inputs:

- `message` (string)
- `slack_bot_token` (secret)
- `slack_channel_id` (secret/var)
- `discord_token` (secret)
- `discord_channel_id` (secret/var)

Guard via `if: failure()` in the caller workflow; keep steps fully optional behind secrets/vars.
