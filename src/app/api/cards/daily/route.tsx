import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { config } from "@/infrastructure/config";
import { getUseCases } from "@/infrastructure/container";
import { verifyCardSignature } from "@/infrastructure/discord/resultsCard";
import { CARD_HEIGHT, cardWidth, ResultsCard } from "../../_lib/ResultsCard";
import { dateSchema } from "../../_lib/http";

export const dynamic = "force-dynamic";

/**
 * The results card image of the daily message. Fetched by Discord (no session), so the
 * guild and date must carry a valid signature — see `resultsCardUrl`.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const guildId = params.get("guild") ?? "";
  const date = dateSchema.safeParse(params.get("date"));
  const signature = params.get("sig") ?? "";
  if (!guildId || !date.success || !verifyCardSignature(guildId, date.data, signature, config.sessionSecret)) {
    return new Response("Assinatura inválida", { status: 403 });
  }

  const app = await getUseCases();
  const summary = await app.getServerSummary({ guildId, date: date.data });
  return new ImageResponse(<ResultsCard summary={summary} />, {
    width: cardWidth(summary),
    height: CARD_HEIGHT,
    // Each version of the results has its own URL (`v`), so it can be cached for good.
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
