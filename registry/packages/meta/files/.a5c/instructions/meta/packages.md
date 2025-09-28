# Package Implementation Guide

This document explains how to structure packages under `registry/packages/*` so they integrate with the A5C runtime.

## Package Layout

Each package must contain a `package.a5c.yaml` manifest. Optional subdirectories provide behaviors:

- `files/.a5c/labels/*.md` — declarative label definitions.
- `files/.a5c/events/*.yaml` — Reactor workflows to drive automation.
- `files/.a5c/commands/<action>/NN-description.md` — agent command templates.
- `files/.a5c/instructions/<agent>/*.prompt.md` — agent operating guides.
- `files/.a5c/app/phases/...` — app-specific UI flows (tree views, progress nodes, etc.).
- `app/pages/*.md` — UI pages rendered in the A5C app (e.g., tree views).
- `INSTALL.md`, `MIGRATIONS.md`, `README.md` — human documentation for installation, migrations, or overview.

Only create subdirectories relevant to your package; omit unused folders.

## Manifest (`package.a5c.yaml`)

The manifest identifies the package, optional dependencies, and categories:

```yaml
kind: a5c.ai/package
name: project-management
icon: url://https://a5c.ai/assets/a5c-logo.png
description: Project Management package
homepage: https://a5c.ai
categories:
  - name: Project Management
```

Add `dependencies:` when your automation relies on other packages:

```yaml
dependencies:
  - github://a5c-ai/a5c/branch/main/registry/packages/frontend-development/
```

## Labels (`files/.a5c/labels/*.md`)

Define reusable GitHub labels. Each file describes a single label:

```yaml
---
name: triage
color: f9d0c4
description: Triage issues
has_trigger: true
targets:
  - issue
---
Add this label to new issues awaiting triage.
```

Set `targets` to `issue` or `pull_request`. Use `has_trigger: true` if downstream workflows listen for the label.

## Events (`files/.a5c/events/*.yaml`)

Event files describe Reactor workflows. Typical structure:

```yaml
---
name: Auto Triage New Issues
metadata:
  runner-name: reactor
on:
  issue:
    filters:
      - expression: ${{ event.type == 'opened' }}
actions:
  - type: label_issue
    params:
      issue: ${{ event.issue.html_url }}
      add_labels: [triage]
```

Emit custom events using `emit:` blocks or trigger agents with `runner-name: agents` and `agent_run` actions. Keep workflows small and composable.

## Commands (`files/.a5c/commands/*`)

Commands supply templates for agent-driven actions. They are Markdown files (often numbered) that describe what the agent should do when the command executes. Example:

```
Triage the issue and apply the recommended labels:
{{#each event.payload.client_payload.payload.among}}
- {{this}}
{{/each}}
```

Organize by command name (e.g., `triage_new_issue/10-basic.md`). Numbering controls execution order.

## Agent Instructions (`files/.a5c/instructions/*`)

Provide operating manuals for agents. Use clear headings and checklists. Group instructions by agent role, for example `files/.a5c/instructions/project-management/producer-agent.prompt.md`.

## App Content (`app/pages/*`)

Packages can expose UI documentation using A5C components. Example tree view definition:

```
```a5c-tree-view labels-heirachy
milestone
    feature - FEATURE
        subtask
```
```

## Supporting Docs

- `INSTALL.md` — setup steps for installing the package.
- `MIGRATIONS.md` — manual notes for migrating between versions.
- `README.md` — summary and usage guidance.

Keep empty files only if required by tooling. Prefer meaningful instructions.

## Development Tips

- Reuse patterns from established packages (`development`, `project-management`).
- Favor YAML for automation, Markdown for instructions.
- Document environment variables or secrets referenced by workflows.
- Ensure label names and colors match other packages when shared.
