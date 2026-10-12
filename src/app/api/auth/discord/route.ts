import { issueSessionToken } from "@/infrastructure/auth/sessionTokens";
import { config } from "@/infrastructure/config";
import { discordLoginSchema, handle, parseBody } from "../../_lib/http";

export const dynamic = "force-dynamic";

/**
 * Step 2 of the Activity login: the client sends the code from `sdk.commands.authorize`.
 * We exchange it (using CLIENT_SECRET), and return both our session token and the
 * Discord access token the client needs for `sdk.commands.authenticate`.
 */
export const POST = handle(async ({ app, request }) => {
  const body = await parseBody(request, discordLoginSchema);
  const { player, accessToken } = await app.authenticateWithDiscord(body);
  const session = issueSessionToken({ playerId: player.id, guildId: body.guildId }, config.sessionSecret);
  return { ...session, accessToken, player };
});
