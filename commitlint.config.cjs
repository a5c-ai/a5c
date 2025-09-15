module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep subject flexible; rely on type/scope validity
    'subject-case': [0],
    'scope-case': [2, 'always', 'kebab-case'],
    // Align with scripts/commit-verify.ts which doesn't limit header length
    'header-max-length': [0],
  },
};
