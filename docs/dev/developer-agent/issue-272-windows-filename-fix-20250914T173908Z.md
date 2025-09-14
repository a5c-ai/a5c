# Issue #272 – Windows checkout failure

- Context: Filenames with `:` under `docs/dev/producer-agent/*` break Windows checkout.
- Plan:
  - Rename offending files: replace `:` with `-` in timestamps
  - Add guard/docs to avoid future `:` in filenames
  - Verify build; open draft PR linking to issue #272

