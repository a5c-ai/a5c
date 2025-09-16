module.exports = {
  extends: ["@commitlint/config-conventional"],
  // Allow a single leading emoji (and optional space) before the type
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?:[^\p{L}\p{N}]+\s*)?(?<type>build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<subject>.+)$/u,
    },
  },
  rules: {
    // Keep subject flexible; rely on type/scope validity
    "subject-case": [0],
    "scope-case": [2, "always", "kebab-case"],
    // Align with scripts/commit-verify.ts which doesn't limit header length
    "header-max-length": [0],
  },
};
