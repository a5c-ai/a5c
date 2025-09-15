module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keep subject flexible; rely on type/scope validity
    'subject-case': [0],
    'scope-case': [2, 'always', 'kebab-case'],
  },
};
