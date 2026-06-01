import { describe, expect, it } from "vitest";

import { CborError, CborReader, decodeCbor } from "./cbor.js";

describe("decodeCbor", () => {
	it("decodes a COSE-shaped map with integer keys and byte/text values", () => {
		// {1: 2, -1: h'AABB'}
		const bytes = new Uint8Array([0xa2, 0x01, 0x02, 0x20, 0x42, 0xaa, 0xbb]);
		const map = decodeCbor(bytes);
		expect(map).toBeInstanceOf(Map);
		const m = map as Map<number, unknown>;
		expect(m.get(1)).toBe(2);
		expect(m.get(-1)).toEqual(new Uint8Array([0xaa, 0xbb]));
	});

	it("decodes negative integers including the two-byte form (-257)", () => {
		expect(decodeCbor(new Uint8Array([0x26]))).toBe(-7);
		expect(decodeCbor(new Uint8Array([0x39, 0x01, 0x00]))).toBe(-257);
	});

	it("supports the boolean/null simple values real extensions use", () => {
		// {"hmac-secret": true}
		const key = new TextEncoder().encode("hmac-secret");
		const bytes = new Uint8Array([0xa1, 0x6b, ...key, 0xf5]);
		const map = decodeCbor(bytes) as Map<string, unknown>;
		expect(map.get("hmac-secret")).toBe(true);
		expect(decodeCbor(new Uint8Array([0xf4]))).toBe(false);
		expect(decodeCbor(new Uint8Array([0xf6]))).toBe(null);
	});

	it("rejects trailing bytes after a complete item", () => {
		expect(() => decodeCbor(new Uint8Array([0x00, 0x00]))).toThrow(CborError);
	});

	it("rejects duplicate map keys", () => {
		expect(() => decodeCbor(new Uint8Array([0xa2, 0x01, 0x00, 0x01, 0x01]))).toThrow(CborError);
	});

	it("rejects tags, indefinite-length items, and floats", () => {
		expect(() => decodeCbor(new Uint8Array([0xc0, 0x00]))).toThrow(CborError); // tag
		expect(() => decodeCbor(new Uint8Array([0x9f, 0xff]))).toThrow(CborError); // indefinite array
		expect(() => decodeCbor(new Uint8Array([0xfa, 0x00, 0x00, 0x00, 0x00]))).toThrow(CborError); // float32
	});

	it("rejects nesting deeper than the depth cap", () => {
		const bytes = new Uint8Array([...Array(20).fill(0x81), 0x00]);
		expect(() => decodeCbor(bytes)).toThrow(CborError);
	});

	it("rejects a length that overruns the buffer", () => {
		// byte string claiming 4 bytes, only 1 present
		expect(() => decodeCbor(new Uint8Array([0x44, 0xaa]))).toThrow(CborError);
	});

	it("surfaces a truncated 8-byte integer as CborError, not RangeError", () => {
		// major-0 info-27 header, then fewer than 8 argument bytes
		const bytes = new Uint8Array([0x1b, 0, 0, 0, 0, 0x01]);
		expect(() => decodeCbor(bytes)).toThrow(CborError);
	});

	it("tracks offset so a caller can find where one item ends", () => {
		const bytes = new Uint8Array([0x42, 0xaa, 0xbb, 0xff, 0xff]);
		const reader = new CborReader(bytes);
		expect(reader.read()).toEqual(new Uint8Array([0xaa, 0xbb]));
		expect(reader.offset).toBe(3);
		expect(reader.atEnd).toBe(false);
	});
});
