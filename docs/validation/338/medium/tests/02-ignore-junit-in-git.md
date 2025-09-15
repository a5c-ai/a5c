## Git Ignore: junit.xml

Context: JUnit XML is a CI/test output and should not be versioned. PR #338 branch had `junit.xml` committed; it has been removed from the index and `**/junit.xml` added to `.gitignore`.

Recommendation (non-blocking): Maintain `**/junit.xml` in `.gitignore` to prevent future accidental commits.
