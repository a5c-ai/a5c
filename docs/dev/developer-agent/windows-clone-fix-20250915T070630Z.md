# Windows clone fix – invalid filename characters

## Context
Cloning failed on Windows due to `:` in filenames within docs under `docs/dev/**`.

## Plan
- Find all files with Windows-invalid characters (esp. `:`)
- Rename to Windows-safe (replace `:` with `-`)
- Update any in-repo references
- Verify build/tests

## Actions
- Scanned repo via `git ls-files` for `[:<>"\\|?*]`
- Identified 4 offending files with timestamps containing `:`
- Plan to rename `THH:MM:SSZ` to `THH-MM-SSZ`

Next: rename offending files and update references.
