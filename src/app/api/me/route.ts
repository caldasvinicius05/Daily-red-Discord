import { handle, requireSession } from "../_lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async ({ app, request }) => {
  const session = requireSession(request);
  return { player: await app.getPlayer(session.playerId), guildId: session.guildId };
});
