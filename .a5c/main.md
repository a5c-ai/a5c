# Prompt

Repo: {{ event.client_payload.repository.full_name }}
Ref: {{ env.GITHUB_REF_NAME || 'a5c/main' }}
Labels: {{#each (event.pull_request && event.pull_request.labels || [])}}{{ this.name }} {{/each}}
{{#include ./part.md }}
