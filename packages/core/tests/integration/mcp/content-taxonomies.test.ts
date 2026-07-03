/**
 * MCP content_create / content_update taxonomy assignment.
 *
 * Regression for #953: `taxonomies` was silently ignored by both tools —
 * accepted without error but never persisted. Mirrors the `bylines` argument
 * added alongside content_create/content_update (see bylines.test.ts).
 */

import { Role } from "@emdash-cms/auth";
import type { Kysely } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TaxonomyRepository } from "../../../src/database/repositories/taxonomy.js";
import type { Database } from "../../../src/database/types.js";
import {
	connectMcpHarness,
	extractJson,
	extractText,
	isErrorResult,
	type McpHarness,
} from "../../utils/mcp-runtime.js";
import { setupTestDatabaseWithCollections, teardownTestDatabase } from "../../utils/test-db.js";

const ADMIN_ID = "user_admin";

describe("MCP content_create / content_update taxonomies", () => {
	let db: Kysely<Database>;
	let harness: McpHarness;
	let taxRepo: TaxonomyRepository;

	beforeEach(async () => {
		db = await setupTestDatabaseWithCollections();
		taxRepo = new TaxonomyRepository(db);
		harness = await connectMcpHarness({ db, userId: ADMIN_ID, userRole: Role.ADMIN });
	});

	afterEach(async () => {
		if (harness) await harness.cleanup();
		await teardownTestDatabase(db);
	});

	it("content_create persists taxonomy assignments by slug", async () => {
		const category = await taxRepo.create({ name: "category", slug: "porady", label: "Porady" });
		const ai = await taxRepo.create({ name: "tag", slug: "ai", label: "AI" });
		const seo = await taxRepo.create({ name: "tag", slug: "seo", label: "SEO" });

		const created = await harness.client.callTool({
			name: "content_create",
			arguments: {
				collection: "post",
				data: { title: "Tagged Post" },
				taxonomies: { category: ["porady"], tag: ["ai", "seo"] },
			},
		});
		expect(created.isError, extractText(created)).toBeFalsy();
		const id = extractJson<{ item: { id: string } }>(created).item.id;

		const categories = await taxRepo.getTermsForEntry("post", id, "category");
		expect(categories.map((t) => t.id)).toEqual([category.id]);

		const tags = await taxRepo.getTermsForEntry("post", id, "tag");
		expect(tags.map((t) => t.id).toSorted()).toEqual([ai.id, seo.id].toSorted());
	});

	it("content_update persists taxonomy assignments by id and replaces prior ones", async () => {
		const category = await taxRepo.create({ name: "category", slug: "news", label: "News" });
		const oldTag = await taxRepo.create({ name: "tag", slug: "old", label: "Old" });
		const newTag = await taxRepo.create({ name: "tag", slug: "new", label: "New" });

		const created = await harness.client.callTool({
			name: "content_create",
			arguments: {
				collection: "post",
				data: { title: "Retag Post" },
				taxonomies: { category: [category.id], tag: [oldTag.id] },
			},
		});
		expect(created.isError, extractText(created)).toBeFalsy();
		const id = extractJson<{ item: { id: string } }>(created).item.id;

		const updated = await harness.client.callTool({
			name: "content_update",
			arguments: {
				collection: "post",
				id,
				taxonomies: { tag: [newTag.id] },
			},
		});
		expect(updated.isError, extractText(updated)).toBeFalsy();

		// `tag` was replaced; `category` was omitted from the update, so it's unchanged.
		const tags = await taxRepo.getTermsForEntry("post", id, "tag");
		expect(tags.map((t) => t.id)).toEqual([newTag.id]);
		const categories = await taxRepo.getTermsForEntry("post", id, "category");
		expect(categories.map((t) => t.id)).toEqual([category.id]);
	});

	it("unresolvable term refs are silently skipped, not an error", async () => {
		const result = await harness.client.callTool({
			name: "content_create",
			arguments: {
				collection: "post",
				data: { title: "Bad Ref Post" },
				taxonomies: { category: ["does-not-exist"] },
			},
		});
		expect(isErrorResult(result)).toBe(false);
		const id = extractJson<{ item: { id: string } }>(result).item.id;
		const categories = await taxRepo.getTermsForEntry("post", id, "category");
		expect(categories).toEqual([]);
	});
});
