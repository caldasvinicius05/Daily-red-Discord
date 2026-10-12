import { describe, expect, it } from "vitest";
import { issueSessionToken, verifySessionToken } from "./sessionTokens";

const SECRET = "test-secret";
const now = new Date("2026-10-12T18:00:00Z");

describe("session tokens", () => {
  it("round-trips a session", () => {
    const { token, expiresAt } = issueSessionToken({ playerId: "alice", guildId: "g1" }, SECRET, now);
    expect(verifySessionToken(token, SECRET, now)).toEqual({ playerId: "alice", guildId: "g1", exp: expiresAt });
  });

  it("rejects tokens signed with another secret or tampered with", () => {
    const { token } = issueSessionToken({ playerId: "alice", guildId: null }, SECRET, now);
    expect(verifySessionToken(token, "other-secret", now)).toBeNull();

    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ playerId: "mallory", guildId: null, exp: now.getTime() + 1e9 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${signature}`, SECRET, now)).toBeNull();
  });

  it("expires after 12 hours", () => {
    const { token } = issueSessionToken({ playerId: "alice", guildId: null }, SECRET, now);
    expect(verifySessionToken(token, SECRET, new Date(now.getTime() + 11 * 3_600_000))).not.toBeNull();
    expect(verifySessionToken(token, SECRET, new Date(now.getTime() + 12 * 3_600_000))).toBeNull();
  });

  it("rejects garbage", () => {
    for (const bad of ["", "abc", "a.b.c", "....", "x.y"]) expect(verifySessionToken(bad, SECRET, now)).toBeNull();
  });
});
