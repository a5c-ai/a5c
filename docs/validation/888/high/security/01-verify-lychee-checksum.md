# [High] Security - Verify lychee binary checksum

### Context
The script `scripts/docs-link-check.sh` downloads a prebuilt lychee binary from GitHub Releases by version, but does not verify a checksum/signature.

### Why it matters
Without checksum verification, there is a small supply-chain risk if the download is tampered with in transit or the release artifact is replaced upstream.

### Recommendation
- Fetch and verify the published checksum for the tarball before extraction (e.g., download `SHA256SUMS` from the release and validate).
- Fail gracefully with a clear message if checksum mismatch occurs.

### Suggested next step
Extend the download block to retrieve and check the SHA256 for the chosen tarball, guarded by a small retry loop to reduce flakiness.
