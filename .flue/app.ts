// App-level wiring. Runs once at Worker boot.
//
// Registers the Cloudflare Workers AI binding with our AI Gateway when
// `CLOUDFLARE_GATEWAY_ID` is bound on the Worker -- the gateway option
// is then forwarded on every `env.AI.run(...)` call, giving us request
// logs + cache + cost tracking. If the binding is unset (e.g. local
// dev with no gateway configured), calls hit Workers AI directly.

import {
	type CloudflareAIBinding,
	type Fetchable,
	flue,
	registerProvider,
} from "@flue/runtime/app";
import { CLOUDFLARE_AI_BINDING_API } from "@flue/runtime/internal";

interface Env {
	AI: CloudflareAIBinding;
	CLOUDFLARE_GATEWAY_ID?: string;
}

let registered = false;

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		if (!registered) {
			// `registerProvider` is last-write-wins; the guard avoids
			// pointless re-registration on every request within an isolate.
			registerProvider("cloudflare-workers-ai", {
				api: CLOUDFLARE_AI_BINDING_API,
				binding: env.AI,
				gateway: env.CLOUDFLARE_GATEWAY_ID
					? {
							id: env.CLOUDFLARE_GATEWAY_ID,
							// 1h cache TTL: triage prompts include the issue body, so
							// the cache key naturally varies per issue. A revisit of the
							// same issue body within an hour returns the cached triage.
							cacheTtl: 3600,
							metadata: { app: "emdash-triage" },
						}
					: undefined,
			});
			registered = true;
		}
		return flue().fetch(request, env, ctx);
	},
} satisfies Fetchable;
