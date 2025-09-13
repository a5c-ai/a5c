# [Medium] README package scope inconsistency

Category: documentation
Priority: medium priority

The README switches package scope from `@a5c-ai/events` (package.json name) to `@a5c/events` in installation and usage examples. This inconsistency can confuse users and break installs.

Recommendations:
- Use `@a5c-ai/events` consistently across README and examples, unless the package is being renamed (then update package.json and repo metadata accordingly).

References:
- README.md
- package.json ("name": "@a5c-ai/events")

