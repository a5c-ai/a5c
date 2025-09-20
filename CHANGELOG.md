## <small>1.20.3 (2025-09-19)</small>

* Merge pull request #978 from a5c-ai/a5c/main ([9923e7a](https://github.com/a5c-ai/events/commit/9923e7a)), closes [#978](https://github.com/a5c-ai/events/issues/978)
* fix: improve environment variable handling in runScripts function ([4f76e44](https://github.com/a5c-ai/events/commit/4f76e44))

## <small>1.20.2 (2025-09-19)</small>

* Merge pull request #977 from a5c-ai/a5c/main ([6597013](https://github.com/a5c-ai/events/commit/6597013)), closes [#977](https://github.com/a5c-ai/events/issues/977)
* fix: update package resolution logic in resolvePkgSpec function ([1ecde45](https://github.com/a5c-ai/events/commit/1ecde45))

## <small>1.20.1 (2025-09-19)</small>

* Merge pull request #976 from a5c-ai/a5c/main ([1729a70](https://github.com/a5c-ai/events/commit/1729a70)), closes [#976](https://github.com/a5c-ai/events/issues/976)
* fix: resolve pkg ([6b6aabf](https://github.com/a5c-ai/events/commit/6b6aabf))

## 1.20.0 (2025-09-18)

* Merge pull request #975 from a5c-ai/a5c/main ([a7e3bf3](https://github.com/a5c-ai/events/commit/a7e3bf3)), closes [#975](https://github.com/a5c-ai/events/issues/975)
* refactor: comment out package resolution logic in resolvePkgSpec function ([61e503c](https://github.com/a5c-ai/events/commit/61e503c))
* feat: enhance validation request conditions in workflow YAML ([93abfbe](https://github.com/a5c-ai/events/commit/93abfbe))

## 1.19.0 (2025-09-18)

* Merge pull request #973 from a5c-ai/a5c/main ([7ebcd0f](https://github.com/a5c-ai/events/commit/7ebcd0f)), closes [#973](https://github.com/a5c-ai/events/issues/973)
* feat: add support for unquoted attribute mapping in transformPipeline function ([0009251](https://github.com/a5c-ai/events/commit/0009251))
* feat: improve git fetch logic in create-pr.sh for target branches ([a0bb8ab](https://github.com/a5c-ai/events/commit/a0bb8ab))
* feat: refine git fetch command in agent.sh for target branches ([80be194](https://github.com/a5c-ai/events/commit/80be194))
* feat: refine validation request conditions in workflow YAML ([d721e1c](https://github.com/a5c-ai/events/commit/d721e1c))
* feat: sanitize PR labels in create-pr.sh before creating pull requests ([d012f29](https://github.com/a5c-ai/events/commit/d012f29))

## 1.18.0 (2025-09-18)

* Merge branch 'a5c/main' of https://github.com/a5c-ai/events into a5c/main ([d2a17c7](https://github.com/a5c-ai/events/commit/d2a17c7))
* Merge pull request #972 from a5c-ai/a5c/main ([e400779](https://github.com/a5c-ai/events/commit/e400779)), closes [#972](https://github.com/a5c-ai/events/issues/972)
* feat: enhance branch checkout logic in agent.sh and create-pr.sh ([3e0f5eb](https://github.com/a5c-ai/events/commit/3e0f5eb))
* feat: enhance git fetch and branch checkout logic in agent.sh and create-pr.sh ([551716a](https://github.com/a5c-ai/events/commit/551716a))
* feat: enhance git repository handling in agent.sh and create-pr.sh ([9d34727](https://github.com/a5c-ai/events/commit/9d34727))
* feat: improve error handling and repository cloning in agent.sh and create-pr.sh ([2e38c9d](https://github.com/a5c-ai/events/commit/2e38c9d))
* feat: skip command_only events in emitToGithub function ([1ccc3f2](https://github.com/a5c-ai/events/commit/1ccc3f2))
* chore: update permissions in workflow YAML files ([e19ab5a](https://github.com/a5c-ai/events/commit/e19ab5a))
* refactor: improve create-pr.sh script for better branch and PR handling ([ba5398c](https://github.com/a5c-ai/events/commit/ba5398c))
* refactor: rename workflow from 'Reactor' to 'Agent Run' in agent-run.yaml ([1686021](https://github.com/a5c-ai/events/commit/1686021))
* refactor: update shell interpreter in agent.sh and create-pr.sh ([3902322](https://github.com/a5c-ai/events/commit/3902322))
* fix: correct logical operator for label checks in YAML event configurations ([f12042b](https://github.com/a5c-ai/events/commit/f12042b))
* fix: handle gh CLI authentication and installation checks in create-pr.sh ([9589f0b](https://github.com/a5c-ai/events/commit/9589f0b))
* fix: refine condition logic for PR creation in create_prs_from_issues.yaml ([f3ee74f](https://github.com/a5c-ai/events/commit/f3ee74f))
* fix: refine label check conditions in YAML event configurations ([4c41159](https://github.com/a5c-ai/events/commit/4c41159))
* fix: update environment variable syntax in create_prs_from_issues.yaml ([e245804](https://github.com/a5c-ai/events/commit/e245804))
* fix: update label check conditions in YAML event configurations ([e49e73c](https://github.com/a5c-ai/events/commit/e49e73c))
* fix: update triage condition logic in triage-new-issues.yaml ([fd4c376](https://github.com/a5c-ai/events/commit/fd4c376))
* build: ensure final newline in .a5c/create-pr.sh (#970) ([7efa5c4](https://github.com/a5c-ai/events/commit/7efa5c4)), closes [#970](https://github.com/a5c-ai/events/issues/970)

## 1.17.0 (2025-09-18)

* ✅ Fix failing golden enrich: issue_comment type (#952) ([6965aad](https://github.com/a5c-ai/events/commit/6965aad)), closes [#952](https://github.com/a5c-ai/events/issues/952) [#950](https://github.com/a5c-ai/events/issues/950)
* 🐛 Update golden: issue_comment enrich type (fixes #944) (#948) ([71b0c2d](https://github.com/a5c-ai/events/commit/71b0c2d)), closes [#944](https://github.com/a5c-ai/events/issues/944) [#948](https://github.com/a5c-ai/events/issues/948)
* 🧪 Add tests: enrich fallback + rules_status metadata (fixes #941) (#953) ([63ad92b](https://github.com/a5c-ai/events/commit/63ad92b)), closes [#941](https://github.com/a5c-ai/events/issues/941) [#953](https://github.com/a5c-ai/events/issues/953) [#941](https://github.com/a5c-ai/events/issues/941) [#941](https://github.com/a5c-ai/events/issues/941) [#941](https://github.com/a5c-ai/events/issues/941)
* 🧪 Fix golden: issue_comment type for issue_comment.created.enrich.json (#951) ([6a446b7](https://github.com/a5c-ai/events/commit/6a446b7)), closes [#951](https://github.com/a5c-ai/events/issues/951) [#949](https://github.com/a5c-ai/events/issues/949) [#949](https://github.com/a5c-ai/events/issues/949) [#949](https://github.com/a5c-ai/events/issues/949)
* 🧪 fix: update golden for issue_comment.created type (fixes #946) (#947) ([f938f20](https://github.com/a5c-ai/events/commit/f938f20)), closes [#946](https://github.com/a5c-ai/events/issues/946) [#947](https://github.com/a5c-ai/events/issues/947) [#946](https://github.com/a5c-ai/events/issues/946) [#946](https://github.com/a5c-ai/events/issues/946)
* chore(docs,ci): add build-fixer notes and fix EOF whitespace for hooks (#945) ([a5ff863](https://github.com/a5c-ai/events/commit/a5ff863)), closes [#945](https://github.com/a5c-ai/events/issues/945)
* Merge branch 'a5c/main' of https://github.com/a5c-ai/events into a5c/main ([13d8a76](https://github.com/a5c-ai/events/commit/13d8a76))
* Merge pull request #954 from a5c-ai/a5c/main ([d7e16b6](https://github.com/a5c-ai/events/commit/d7e16b6)), closes [#954](https://github.com/a5c-ai/events/issues/954)
* feat: add create PR script and event configuration ([915f63b](https://github.com/a5c-ai/events/commit/915f63b))
* feat: enhance triage and validation workflows with new agent runs ([4fb9e99](https://github.com/a5c-ai/events/commit/4fb9e99))
* feat: introduce agent script ([63fc7fb](https://github.com/a5c-ai/events/commit/63fc7fb))
* fix(ci): normalize LF endings and add trailing newline to .a5c/agent.sh\n\nchore(docs): add progress ([e6fb366](https://github.com/a5c-ai/events/commit/e6fb366))
* refactor: remove set -euo pipefail from triage and validation scripts ([88d406d](https://github.com/a5c-ai/events/commit/88d406d))

## 1.16.0 (2025-09-18)

* 📝 README overhaul: reflect current implementation, name, purpose, scope (#939) ([787995f](https://github.com/a5c-ai/events/commit/787995f)), closes [#939](https://github.com/a5c-ai/events/issues/939) [#938](https://github.com/a5c-ai/events/issues/938) [#938](https://github.com/a5c-ai/events/issues/938)
* Merge pull request #942 from a5c-ai/a5c/main ([d5c3986](https://github.com/a5c-ai/events/commit/d5c3986)), closes [#942](https://github.com/a5c-ai/events/issues/942)
* feat(triage): add workflow for triaging new issues ([762346f](https://github.com/a5c-ai/events/commit/762346f))
* feat(triage): enable triage configuration and enhance event handling ([1c560ea](https://github.com/a5c-ai/events/commit/1c560ea))
* fix(event): correct event trigger from 'issue' to 'issues' in triage workflow ([dea4a61](https://github.com/a5c-ai/events/commit/dea4a61))

## 1.15.0 (2025-09-18)

* Merge pull request #937 from a5c-ai/a5c/main ([57fb8b3](https://github.com/a5c-ai/events/commit/57fb8b3)), closes [#937](https://github.com/a5c-ai/events/issues/937)
* feat(validation): implement status checks for validation requests ([80d3c16](https://github.com/a5c-ai/events/commit/80d3c16))

## 1.14.0 (2025-09-18)

* Merge pull request #936 from a5c-ai/a5c/main ([d5256e3](https://github.com/a5c-ai/events/commit/d5256e3)), closes [#936](https://github.com/a5c-ai/events/issues/936)
* feat(validation): enhance event handling with global skip conditions and refined validation logic ([cae3ff2](https://github.com/a5c-ai/events/commit/cae3ff2))
* chore: update package.json to include predefined.yaml and enhance temporary event JSON handling ([6d62270](https://github.com/a5c-ai/events/commit/6d62270))
* refactor: Remove obsolete files related to scan timing, task start, and test outputs ([7048e59](https://github.com/a5c-ai/events/commit/7048e59))

## 1.13.0 (2025-09-18)

* Merge pull request #935 from a5c-ai/a5c/main ([4c9fa1d](https://github.com/a5c-ai/events/commit/4c9fa1d)), closes [#935](https://github.com/a5c-ai/events/issues/935)
* feat(cli): introduce predefined CLI command templates and run command ([8943664](https://github.com/a5c-ai/events/commit/8943664))
* chore(deps): align vitest and coverage plugin to v3.2.4; verify tests pass (#933) ([1cdbb3b](https://github.com/a5c-ai/events/commit/1cdbb3b)), closes [#933](https://github.com/a5c-ai/events/issues/933)

## 1.12.0 (2025-09-18)

* Merge branch 'a5c/main' of https://github.com/a5c-ai/events into a5c/main ([fa5a51a](https://github.com/a5c-ai/events/commit/fa5a51a))
* Merge branch 'main' into a5c/main ([a9b27bc](https://github.com/a5c-ai/events/commit/a9b27bc))
* Merge pull request #934 from a5c-ai/a5c/main ([f4ef075](https://github.com/a5c-ai/events/commit/f4ef075)), closes [#934](https://github.com/a5c-ai/events/issues/934)
* feat(emit): add temporary event JSON file creation for script execution ([49831fc](https://github.com/a5c-ai/events/commit/49831fc))
* fix(validation): improve script execution and label processing with context entity inference ([3e9e936](https://github.com/a5c-ai/events/commit/3e9e936))
* docs: observability defaults aligned (pretty-by-default; JSON in CI) ([19c976c](https://github.com/a5c-ai/events/commit/19c976c)), closes [#904](https://github.com/a5c-ai/events/issues/904)

## <small>1.11.5 (2025-09-18)</small>

- chore(deps)(deps-dev): bump @semantic-release/github ([7b0efba](https://github.com/a5c-ai/events/commit/7b0efba))
- chore(deps)(deps-dev): bump lint-staged from 15.5.2 to 16.1.6 ([3dd56a0](https://github.com/a5c-ai/events/commit/3dd56a0))
- chore(deps)(deps-dev): bump the minor-and-patch group with 4 updates ([e568208](https://github.com/a5c-ai/events/commit/e568208))
- chore(deps)(deps): bump actions/checkout in /.github/workflows ([841748c](https://github.com/a5c-ai/events/commit/841748c))
- chore(deps)(deps): bump actions/setup-python in /.github/workflows ([7a1e7a2](https://github.com/a5c-ai/events/commit/7a1e7a2))
- chore(deps)(deps): bump codecov/codecov-action in /.github/workflows ([b91516d](https://github.com/a5c-ai/events/commit/b91516d))
- Merge pull request #909 from a5c-ai/dependabot/github_actions/dot-github/workflows/codecov/codecov-a ([0b5182c](https://github.com/a5c-ai/events/commit/0b5182c)), closes [#909](https://github.com/a5c-ai/events/issues/909)
- Merge pull request #910 from a5c-ai/dependabot/github_actions/dot-github/workflows/actions/setup-pyt ([add99bb](https://github.com/a5c-ai/events/commit/add99bb)), closes [#910](https://github.com/a5c-ai/events/issues/910)
- Merge pull request #911 from a5c-ai/dependabot/github_actions/dot-github/workflows/actions/checkout- ([9eaa810](https://github.com/a5c-ai/events/commit/9eaa810)), closes [#911](https://github.com/a5c-ai/events/issues/911)
- Merge pull request #913 from a5c-ai/dependabot/npm_and_yarn/minor-and-patch-9282712fcc ([695becb](https://github.com/a5c-ai/events/commit/695becb)), closes [#913](https://github.com/a5c-ai/events/issues/913)
- Merge pull request #915 from a5c-ai/dependabot/npm_and_yarn/semantic-release/github-11.0.6 ([db8072e](https://github.com/a5c-ai/events/commit/db8072e)), closes [#915](https://github.com/a5c-ai/events/issues/915)
- Merge pull request #916 from a5c-ai/dependabot/npm_and_yarn/lint-staged-16.1.6 ([883c303](https://github.com/a5c-ai/events/commit/883c303)), closes [#916](https://github.com/a5c-ai/events/issues/916)
- Merge pull request #931 from a5c-ai/a5c/main ([efe97c7](https://github.com/a5c-ai/events/commit/efe97c7)), closes [#931](https://github.com/a5c-ai/events/issues/931)
- fix(emit): enhance label processing and script execution with context entity inference ([e6f4825](https://github.com/a5c-ai/events/commit/e6f4825))
