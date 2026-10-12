import { NotFoundError } from "@/application/errors";
import { issueSessionToken } from "@/infrastructure/auth/sessionTokens";
import { config } from "@/infrastructure/config";
import { devLoginSchema, handle, parseBody } from "../../_lib/http";

export const dynamic = "force-dynamic";

/** Everyone who logs in this way shares one fake server, so the leaderboard can be tested locally. */
const DEV_GUILD_ID = "dev-guild";

/** Local-only login without Discord: pick any name and play. Disabled in production builds. */
export const POST = handle(async ({ app, request }) => {
  if (!config.devLoginEnabled) throw new NotFoundError("Rota não encontrada");
  const { name } = await parseBody(request, devLoginSchema);
  const slug = name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "jogador";
  const player = { id: `dev-${slug}`, username: slug, displayName: name, avatar: null };
  await app.registerPlayer(player);
  return { ...issueSessionToken({ playerId: player.id, guildId: DEV_GUILD_ID }, config.sessionSecret), player };
});
