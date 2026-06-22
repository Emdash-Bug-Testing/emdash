import { describe, it, expect } from "vitest";

import {
	_portableTextToProsemirror,
	_prosemirrorToPortableText,
} from "../../src/components/PortableTextEditor";

type ImageBlock = {
	_type: "image";
	asset: { _ref: string; url?: string };
	alignment?: string;
};

function isImageBlock(b: unknown): b is ImageBlock {
	return typeof b === "object" && b !== null && (b as { _type?: unknown })._type === "image";
}

describe("PortableTextEditor image alignment round-trip", () => {
	it("preserves alignment PT → PM → PT (regression for #1404)", () => {
		const block = {
			_type: "image" as const,
			_key: "img1",
			asset: { _ref: "media1", url: "/file/media1" },
			alt: "Imported image",
			alignment: "wide" as const,
		};

		const pm = _portableTextToProsemirror([block]);
		const imageNode = pm.content.find((n) => n.type === "image");
		expect(imageNode?.attrs?.alignment).toBe("wide");

		const pt = _prosemirrorToPortableText(pm).find(isImageBlock);
		expect(pt?.alignment).toBe("wide");
	});

	it("omits alignment when unset", () => {
		const block = {
			_type: "image" as const,
			_key: "img2",
			asset: { _ref: "media2", url: "/file/media2" },
			alt: "Plain image",
		};
		const pt = _prosemirrorToPortableText(_portableTextToProsemirror([block])).find(isImageBlock);
		expect(pt?.alignment).toBeUndefined();
	});
});
