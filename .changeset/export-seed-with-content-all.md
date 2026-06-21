---
"emdash": patch
---

Fixes `emdash export-seed --with-content=all` exporting no content. The literal `all` value documented in the flag's help is now treated as "every collection" (like the bare `--with-content`), instead of being matched against a collection named "all" and silently exporting nothing. Closes #1329.
