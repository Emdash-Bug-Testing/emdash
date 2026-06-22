import { describe, it, expect } from "vitest";

import { portableTextToProsemirror } from "../../../src/content/converters/portable-text-to-prosemirror.js";
import { prosemirrorToPortableText } from "../../../src/content/converters/prosemirror-to-portable-text.js";
import type {
	ProseMirrorDocument,
	PortableTextImageBlock,
} from "../../../src/content/converters/types.js";

describe("Image alignment round-trip (core converters)", () => {
	it("preserves image alignment through PT → PM → PT", () => {
		const imageBlock: PortableTextImageBlock = {
			_type: "image",
			_key: "img001",
			asset: { _ref: "media123", url: "/file/media123" },
			alt: "An aligned image",
			alignment: "wide",
		};

		// PT → PM
		const pm = portableTextToProsemirror([imageBlock]);
		expect(pm.content[0].type).toBe("image");
		expect(pm.content[0].attrs?.alignment).toBe("wide");

		// PM → PT
		const pt = prosemirrorToPortableText(pm);
		const restored = pt[0] as PortableTextImageBlock;
		expect(restored._type).toBe("image");
		expect(restored.alignment).toBe("wide");
	});

	it("preserves each supported alignment value", () => {
		for (const alignment of ["left", "center", "right", "wide", "full"] as const) {
			const doc: ProseMirrorDocument = {
				type: "doc",
				content: [{ type: "image", attrs: { src: "/x.jpg", alt: "x", alignment } }],
			};
			const pt = prosemirrorToPortableText(doc);
			expect((pt[0] as PortableTextImageBlock).alignment).toBe(alignment);
		}
	});

	it("omits alignment when unset", () => {
		const doc: ProseMirrorDocument = {
			type: "doc",
			content: [{ type: "image", attrs: { src: "/x.jpg", alt: "x" } }],
		};
		const pt = prosemirrorToPortableText(doc);
		expect((pt[0] as PortableTextImageBlock).alignment).toBeUndefined();

		const block: PortableTextImageBlock = {
			_type: "image",
			_key: "img002",
			asset: { _ref: "m", url: "/file/m" },
		};
		const pm = portableTextToProsemirror([block]);
		expect(pm.content[0].attrs?.alignment).toBeUndefined();
	});
});
