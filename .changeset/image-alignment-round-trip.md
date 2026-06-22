---
"emdash": patch
"@emdash-cms/admin": patch
---

Preserve image alignment through the editor and render it on the published page (#1404). Images imported from WordPress/Gutenberg carry a horizontal alignment (`left`, `right`, `center`, `wide`, `full`), but that value was dropped the moment the post was opened in the editor — the Portable Text ↔ ProseMirror round-trip silently discarded it, so re-saving an imported post flattened every aligned image to the default. The alignment now survives the round-trip in both the core and admin converters and the image node schema, and the core `Image.astro` component renders it with matching CSS so aligned images display as authored.
