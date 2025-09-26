---
name: spec-driven-milestone
label: spec_milestone
states:
  - name: proposed
    description: Milestone drafted from specifications and awaiting review.
  - name: approved
    description: Milestone reviewed and accepted.
  - name: in_progress
    description: Milestone execution underway.
  - name: completed
    description: Milestone successfully completed.
  - name: retired
    description: Milestone superseded or no longer relevant.
transitions:
  - from: proposed
    to: approved
    command: review_milestone
  - from: approved
    to: in_progress
  - from: in_progress
    to: completed
  - from: completed
    to: retired
metadata:
  template: .a5c/milestones/template.md
  issue_template: .github/ISSUE_TEMPLATE/milestone_planning.md
