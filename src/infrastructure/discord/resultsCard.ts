import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ServerSummary } from "@/application/ports";

/**
 * Address of a server's results card image. Discord fetches it without a session, so the
 * guild and date are signed: nobody can list another server's players by guessing ids.
 * `v` changes whenever the results do, so Discord doesn't show a stale cached card.
 */
export function resultsCardUrl(baseUrl: string, summary: ServerSummary, secret: string): string {
  const version = createHash("sha256").update(JSON.stringify(summary.entries.map((e) => [e.player.id, e.result]))).digest("hex").slice(0, 10);
  const params = new URLSearchParams({
    guild: summary.guildId,
    date: summary.date,
    v: version,
    sig: signCard(summary.guildId, summary.date, secret),
  });
  return `${baseUrl}/api/cards/daily?${params}`;
}

function signCard(guildId: string, date: string, secret: string): string {
  return createHmac("sha256", secret).update(`results-card:${guildId}:${date}`).digest("base64url");
}

export function verifyCardSignature(guildId: string, date: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(signCard(guildId, date, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
