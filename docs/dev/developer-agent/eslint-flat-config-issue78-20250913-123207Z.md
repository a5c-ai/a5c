# ESLint v9 Flat Config Migration (Issue #78)

## Plan
- Add eslint.config.js (flat config) using @eslint/js, @typescript-eslint/*, eslint-config-prettier
- Remove legacy .eslintrc.json
- Install missing TypeScript ESLint deps
- Verify `npm run lint` locally
- Add fast PR lint workflow and hook it to a5c routing

## Notes
- Keep script: `npm run lint` -> `eslint . --ext .ts`
- Scope: TS files under src/, tests under test/ and tests/
