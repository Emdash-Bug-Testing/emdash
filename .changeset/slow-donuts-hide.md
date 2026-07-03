---
"emdash": patch
---

Fixes `content_create` and `content_update` MCP tools silently ignoring the `taxonomies` field. Both tools now accept a `taxonomies` object keyed by taxonomy name (e.g. `{ category: ["porady"], tag: ["ai", "seo"] }`), with each value a list of term slugs or ids, and persist the assignments.
