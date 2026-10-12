import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDiscordRequest } from "./verifyInteraction";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
// Raw 32-byte public key as hex, the format the Developer Portal shows.
const publicKeyHex = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");

function signed(body: string, timestamp = "1791830000") {
  return { body, timestamp, signature: sign(null, Buffer.from(timestamp + body), privateKey).toString("hex") };
}

describe("verifyDiscordRequest", () => {
  it("accepts a request signed with the app key", () => {
    const { body, timestamp, signature } = signed('{"type":1}');
    expect(verifyDiscordRequest(body, signature, timestamp, publicKeyHex)).toBe(true);
  });

  it("rejects a tampered body or timestamp", () => {
    const { body, timestamp, signature } = signed('{"type":1}');
    expect(verifyDiscordRequest('{"type":2}', signature, timestamp, publicKeyHex)).toBe(false);
    expect(verifyDiscordRequest(body, signature, "1791830001", publicKeyHex)).toBe(false);
  });

  it("rejects missing or malformed headers and keys", () => {
    const { body, timestamp, signature } = signed('{"type":1}');
    expect(verifyDiscordRequest(body, null, timestamp, publicKeyHex)).toBe(false);
    expect(verifyDiscordRequest(body, signature, null, publicKeyHex)).toBe(false);
    expect(verifyDiscordRequest(body, "zz", timestamp, publicKeyHex)).toBe(false);
    expect(verifyDiscordRequest(body, signature, timestamp, "")).toBe(false);
    expect(verifyDiscordRequest(body, signature, timestamp, "ab".repeat(32))).toBe(false);
  });
});
