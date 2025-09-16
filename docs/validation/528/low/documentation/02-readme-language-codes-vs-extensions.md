# [Low] Documentation — README uses extensions vs language codes for mentions.languages

File: README.md

README examples use `mentions.languages=<ext,...>` (e.g., `ts,tsx,js,jsx`) while CLI docs specify language codes (e.g., `js,ts,py,go,java,c,cpp,sh,yaml,md`) with `.tsx`/`.jsx` mapping to `ts`/`js`.

Impact: Potential confusion for users.

Proposed fix: Align README to language codes and explicitly note the extension mapping (`.tsx -> ts`, `.jsx -> js`), matching CLI reference.
