---
"emdash": patch
---

fix(core): fail fast with an actionable error for plugins without an entrypoint (#1416)

`generatePluginsModule` assumed every plugin descriptor had a file entrypoint and emitted `import pluginDefN from "${descriptor.entrypoint}";`. For an in-process plugin — an inline `definePlugin({...})` result passed directly to `plugins: []` — `entrypoint` is `undefined`, so the generated virtual module contained `import pluginDef0 from "undefined";` and the build failed deep in Rollup with the cryptic `Rollup failed to resolve import "undefined" from "virtual:emdash/plugins"`.

The generator now throws a clear, actionable error that names the offending plugin and explains that `plugins: []` entries must resolve to a file/package entrypoint (bundled at build time), so an inline `definePlugin({...})` result is not supported — move the plugin into its own module and reference it via a factory that returns a descriptor with an `entrypoint`.
