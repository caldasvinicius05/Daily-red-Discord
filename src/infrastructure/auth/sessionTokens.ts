import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless session: `base64url(payload).base64url(hmac)`.
 * Sent as a Bearer token rather than a cookie, because the Activity runs inside
 * Discord's iframe where third-party cookies are unreliable.
 */
export interface Session {
  playerId: string;
  /** Discord server the Activity was opened in (null in DMs and local dev). */
  guildId: string | null;
  /** Expiry, epoch ms. */
  exp: number;
}

const TTL_MS = 12 * 60 * 60 * 1000;

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function issueSessionToken(
  session: Omit<Session, "exp">,
  secret: string,
  now: Date = new Date(),
): { token: string; expiresAt: number } {
  const payload: Session = { ...session, exp: now.getTime() + TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${data}.${sign(data, secret)}`, expiresAt: payload.exp };
}

/** Returns the session, or null if the token is malformed, forged or expired. */
export function verifySessionToken(token: string, secret: string, now: Date = new Date()): Session | null {
  const [data, signature, extra] = token.split(".");
  if (!data || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(data, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const session = JSON.parse(Buffer.from(data, "base64url").toString()) as Session;
    if (typeof session.playerId !== "string" || typeof session.exp !== "number") return null;
    if (session.exp <= now.getTime()) return null;
    return { playerId: session.playerId, guildId: session.guildId ?? null, exp: session.exp };
  } catch {
    return null;
  }
}
