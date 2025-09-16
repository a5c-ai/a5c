# Implement #664: Align offline enrich reason to 'flag:not_set'

Started: 20250916T094313Z UTC

Plan:

- Update code: src/enrich.ts offline reason to 'flag:not_set'
- Update tests: expect 'flag:not_set' offline
- Keep docs unchanged (per validator note)
- Verify npm test passes (149/149 baseline)

Notes:

- CLI path should still exit code 3 when --use-github without token
