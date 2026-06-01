import { createPublicKey, generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { DerError, ecdsaDerToRaw, encodeRsaSpki } from "./der.js";

describe("ecdsaDerToRaw", () => {
	it("left-pads short integers to the coordinate width", () => {
		// SEQUENCE { INTEGER 1, INTEGER 2 }
		const der = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02]);
		const raw = ecdsaDerToRaw(der, 32);
		expect(raw.length).toBe(64);
		expect(raw[31]).toBe(1);
		expect(raw[63]).toBe(2);
		expect(raw.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	it("strips the positive-sign 0x00 padding byte", () => {
		// INTEGER 0x00FF (leading zero keeps it positive) -> last byte 0xFF
		const der = new Uint8Array([0x30, 0x07, 0x02, 0x02, 0x00, 0xff, 0x02, 0x01, 0x01]);
		const raw = ecdsaDerToRaw(der, 32);
		expect(raw[31]).toBe(0xff);
		expect(raw[63]).toBe(1);
	});

	it("rejects trailing bytes", () => {
		const der = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02, 0x99]);
		expect(() => ecdsaDerToRaw(der, 32)).toThrow(DerError);
	});

	it("rejects an integer wider than the coordinate size", () => {
		const wide = new Uint8Array(33).fill(0x11);
		const der = new Uint8Array([0x30, 0x26, 0x02, 0x21, ...wide, 0x02, 0x01, 0x01]);
		expect(() => ecdsaDerToRaw(der, 32)).toThrow(DerError);
	});

	it("rejects a non-SEQUENCE or non-INTEGER structure", () => {
		expect(() => ecdsaDerToRaw(new Uint8Array([0x02, 0x01, 0x01]), 32)).toThrow(DerError);
		expect(() => ecdsaDerToRaw(new Uint8Array([0x30, 0x03, 0x04, 0x01, 0x01]), 32)).toThrow(
			DerError,
		);
	});

	it("rejects a sequence length that disagrees with the buffer", () => {
		const der = new Uint8Array([0x30, 0x10, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02]);
		expect(() => ecdsaDerToRaw(der, 32)).toThrow(DerError);
	});
});

describe("encodeRsaSpki", () => {
	it("produces SPKI that Node parses back to the original modulus and exponent", () => {
		const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
		const jwk = publicKey.export({ format: "jwk" }) as { n: string; e: string };
		const n = Buffer.from(jwk.n, "base64url");
		const e = Buffer.from(jwk.e, "base64url");

		const spki = encodeRsaSpki(n, e);
		const roundTripped = createPublicKey({
			key: Buffer.from(spki),
			format: "der",
			type: "spki",
		}).export({ format: "jwk" }) as { n: string; e: string };

		expect(roundTripped.n).toBe(jwk.n);
		expect(roundTripped.e).toBe(jwk.e);
	});

	it("normalizes a modulus carrying a spurious leading zero byte", () => {
		const { publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
		const jwk = publicKey.export({ format: "jwk" }) as { n: string; e: string };
		const n = Buffer.from(jwk.n, "base64url");
		const e = Buffer.from(jwk.e, "base64url");

		const canonical = encodeRsaSpki(n, e);
		const padded = encodeRsaSpki(Buffer.concat([Buffer.from([0x00]), n]), e);
		expect(Buffer.from(padded)).toEqual(Buffer.from(canonical));
	});
});
