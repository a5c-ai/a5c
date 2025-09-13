# Component: Providers

## GitHub Adapter (MVP)
- Inputs: `workflow_run`, `pull_request`, `push`, `issue_comment`
- Sources: Actions runtime env or webhook JSON
- API usage: REST (with GraphQL as optional)
- Rate limiting/backoff; ETag caching when possible

## Future Adapters
- GitLab, Bitbucket, Generic Webhook
