# Prompt

Repo: {{ event.payload.repository.full_name }}
Ref: {{ env.GITHUB_REF_NAME || 'a5c/main' }}
Labels: {{#each (event.payload.client_payload.pull_request && event.payload.client_payload.pull_request.labels || [])}}{{ this.name }} {{/each}}
{{#include ./part.md }}
