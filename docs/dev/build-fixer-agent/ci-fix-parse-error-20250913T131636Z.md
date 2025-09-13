# CI fix: package.json parse error (EJSONPARSE)

- Detected npm EJSONPARSE in GH Actions run https://github.com/a5c-ai/events/actions/runs/17697021343
- Root cause: trailing stray `}` at EOF in package.json on branch `a5c/main`.
- Fix: remove extra bracket, keep valid JSON structure.
- Verified via local `npm ci`, `npm run build`, and `npm run test:ci`.

By: [build-fixer-agent](https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
