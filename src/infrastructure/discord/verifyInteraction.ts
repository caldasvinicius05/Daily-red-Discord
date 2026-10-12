import { createPublicKey, verify, type KeyObject } from "node:crypto";

// DER prefix that wraps a raw 32-byte Ed25519 key as an SPKI public key.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

const keyCache = new Map<string, KeyObject>();

function publicKeyFromHex(hex: string): KeyObject {
  let key = keyCache.get(hex);
  if (!key) {
    key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(hex, "hex")]), format: "der", type: "spki" });
    keyCache.set(hex, key);
  }
  return key;
}

/**
 * Discord signs every interaction request with the app's key (the PUBLIC_KEY in the
 * Developer Portal). Requests that fail this check must be rejected with 401 — Discord
 * itself tests that when the endpoint URL is saved.
 */
export function verifyDiscordRequest(
  rawBody: string,
  signatureHex: string | null,
  timestamp: string | null,
  publicKeyHex: string,
): boolean {
  if (!signatureHex || !timestamp || !publicKeyHex) return false;
  if (!/^[0-9a-f]{128}$/i.test(signatureHex) || !/^[0-9a-f]{64}$/i.test(publicKeyHex)) return false;
  try {
    return verify(null, Buffer.from(timestamp + rawBody), publicKeyFromHex(publicKeyHex), Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}
