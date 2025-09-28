## Command: repo2specs_deep_analysis

Goal: Produce full specifications and cross-discipline documentation from the existing repository.

### Analysis Tracks
- **System Components**: Identify services, modules, libraries, frameworks, language versions, dependencies, data stores.
- **Infrastructure**: CI/CD pipelines, infra-as-code, deployments, environments, secrets management.
- **Product & UX**: Features, user stories, personas, navigation flows, page/component inventory.
- **Best Practices**: Coding standards, testing strategies, coverage targets, branch policies.
- **DevOps**: Release cadence, versioning scheme, environment promotion, observability.
- **Quality**: Linting, testing frameworks, static analysis, QA gates.
- **Design & Branding**: Design system, typography, color palette, components, theming.
- **Assets**: Screenshots, diagrams, external references.

### Actions
1. For each track, gather evidence from repository files, configs, docs.
2. Document findings in respective folders under `docs/repo2specs/**`.
3. Highlight gaps, risks, TODOs in `docs/repo2specs/recommendations/backlog.md`.
4. Prepare summary comment referencing key outputs.

### Outputs
- Updated documentation across system, product, devops, quality, design directories.
- Summary comment with links to generated files.

