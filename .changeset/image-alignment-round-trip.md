---
"emdash": patch
"@emdash-cms/admin": patch
---

Preserve image alignment on posts imported from WordPress/Gutenberg (#1404). Imported images carry a horizontal alignment (`left`, `right`, `center`, `wide`, `full`), but opening an imported post in the editor and re-saving used to flatten every aligned image back to the default. Alignment now survives editing, and aligned images display as authored on the published page.
