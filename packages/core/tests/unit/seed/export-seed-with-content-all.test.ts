import type { Kysely } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exportSeed } from "../../../src/cli/commands/export-seed.js";
import { ContentRepository } from "../../../src/database/repositories/content.js";
import type { Database } from "../../../src/database/types.js";
import { setI18nConfig } from "../../../src/i18n/config.js";
import { SchemaRegistry } from "../../../src/schema/registry.js";
import { setupTestDatabase, teardownTestDatabase } from "../../utils/test-db.js";

describe("exportSeed: --with-content=all", () => {
	let db: Kysely<Database>;

	beforeEach(async () => {
		setI18nConfig(null);
		db = await setupTestDatabase();

		const registry = new SchemaRegistry(db);
		await registry.createCollection({ slug: "posts", label: "Posts" });
		await registry.createField("posts", { slug: "title", label: "Title", type: "string" });
		await registry.createCollection({ slug: "pages", label: "Pages" });
		await registry.createField("pages", { slug: "title", label: "Title", type: "string" });

		const contentRepo = new ContentRepository(db);
		await contentRepo.create({
			type: "posts",
			slug: "hello",
			status: "published",
			data: { title: "Hello World" },
		});
		await contentRepo.create({
			type: "pages",
			slug: "about",
			status: "published",
			data: { title: "About" },
		});
	});

	afterEach(async () => {
		await teardownTestDatabase(db);
		setI18nConfig(null);
	});

	it("exports every collection's content when withContent is the literal 'all'", async () => {
		// The CLI help documents `all` as a valid value, so it must behave like
		// the "" / "true" sentinel rather than being treated as a collection name.
		const seed = await exportSeed(db, "all");

		expect(seed.content?.posts?.map((e) => e.slug)).toEqual(["hello"]);
		expect(seed.content?.pages?.map((e) => e.slug)).toEqual(["about"]);
	});
});
