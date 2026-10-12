import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/infrastructure/config";
import { getUseCases } from "@/infrastructure/container";
import { verifyDiscordRequest } from "@/infrastructure/discord/verifyInteraction";
import { leaderboardMessage } from "../_lib/discordMessages";

export const dynamic = "force-dynamic";

// Discord interaction / response types we use.
const PING = 1;
const APPLICATION_COMMAND = 2;
const PONG = 1;
const CHANNEL_MESSAGE = 4;
const LAUNCH_ACTIVITY = 12;
const PRIMARY_ENTRY_POINT = 4;
const EPHEMERAL = 1 << 6;

interface Interaction {
  type: number;
  guild_id?: string;
  data?: { name?: string; type?: number };
}

/**
 * Interactions endpoint (set as "Interactions Endpoint URL" in the Developer Portal).
 * Handles the `/dailybattle` slash command (and the old `/dailyred` name, until it is
 * removed from Discord). Signature-checked with PUBLIC_KEY.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // The signature covers the exact raw body, so read it as text before parsing.
  const raw = await request.text();
  const valid = verifyDiscordRequest(
    raw,
    request.headers.get("x-signature-ed25519"),
    request.headers.get("x-signature-timestamp"),
    config.discordPublicKey,
  );
  if (!valid) return NextResponse.json({ error: "invalid request signature" }, { status: 401 });

  const interaction = JSON.parse(raw) as Interaction;
  if (interaction.type === PING) return NextResponse.json({ type: PONG });

  if (interaction.type === APPLICATION_COMMAND) {
    // The Activity's own "Launch" entry point: just open it.
    if (interaction.data?.type === PRIMARY_ENTRY_POINT) return NextResponse.json({ type: LAUNCH_ACTIVITY });

    if (interaction.data?.name === "dailybattle" || interaction.data?.name === "dailyred") {
      if (!interaction.guild_id) {
        return NextResponse.json({
          type: CHANNEL_MESSAGE,
          data: { content: "Use esse comando dentro de um servidor para ver o ranking dele.", flags: EPHEMERAL },
        });
      }
      const app = await getUseCases();
      const { date, champion, entries } = await app.getLeaderboard({ guildId: interaction.guild_id });
      return NextResponse.json({ type: CHANNEL_MESSAGE, data: leaderboardMessage(date, champion, entries) });
    }
  }

  return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Comando desconhecido.", flags: EPHEMERAL } });
}
