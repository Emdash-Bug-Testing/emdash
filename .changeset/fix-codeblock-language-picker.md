---
"@emdash-cms/admin": patch
---

Fix the code block language picker closing the moment you interact with its suggestion dropdown. The dropdown renders in a portal (outside the picker's DOM), so selecting a language -- or stray pointer events from browser extensions such as password managers -- was treated as an outside click and dismissed the picker before the choice was applied.
