module.exports = {
  extends: ["@commitlint/config-conventional"],
  // Lenient parser: allow optional type block; still capture subject
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?:[^\p{L}\p{N}]+\s*)?(?:(?<type>build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*)?(?<subject>.+)$/u,
      headerCorrespondence: ["type", "scope", "breaking", "subject"],
    },
  },
  rules: {
    // Permit commits without a conventional type in release merge PRs
    "type-empty": [0],
    // Do not enforce subject casing in lenient mode
    // (release/main PRs may include auto-generated or title-cased subjects)
    "subject-case": [0],
    // Keep scope formatting consistent when provided
    "scope-case": [2, "always", "kebab-case"],
    // Do not enforce header/body/footer lengths in CI
    "header-max-length": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
