Triage the issue (understand it, don't do anything) and add the proper labels to the issue {{event.payload.client_payload.payload.issue.number}}:

the recommended labels to choose from are:
{{#each event.payload.client_payload.payload.among}}
- {{this}}
{{/each}}
