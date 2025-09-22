Triage the issue (understand it, don't do anything) and add the proper labels to the issue {{event.payload.issue.number}}:

the recommended labels to choose from are:
{{#each event.payload.among}}
- {{this}}
{{/each}}
