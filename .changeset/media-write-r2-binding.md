---
"emdash": patch
---

Fix `ctx.media.upload()` and `ctx.media.delete()` being unavailable to in-process plugins on storage backends that don't support presigned URLs, such as the Cloudflare R2 Worker binding (#1313). A plugin granted `media:write` previously lost all write access whenever `getUploadUrl` was unset — even though `upload()` only needs a storage backend — forcing plugins to bypass the media API and write to the bucket directly. Write access is now granted when either a presigned-URL provider or a direct storage backend is configured. Calling `media.getUploadUrl()` on a backend without presigned-URL support now throws a clear "not supported" error instead of silently stripping `upload()` from the context.
