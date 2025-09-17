Hello {{ event.repository.full_name }}
{{#if env.USER}}User: {{ env.USER }}{{/if}}
List: {{#each event.labels}}{{ this }} {{/each}}
Include:
{{> file:///home/runner/work/events/events/tmp-ctx-mueh7x/part.md name=World }}
