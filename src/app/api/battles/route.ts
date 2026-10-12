import { handle, parseBody, requireSession, startBattleSchema } from "../_lib/http";

export const dynamic = "force-dynamic";

/** Starts (or, for the daily, resumes) a battle. */
export const POST = handle(async ({ app, request }) => {
  const session = requireSession(request);
  const body = await parseBody(request, startBattleSchema);
  return app.startBattle({ playerId: session.playerId, guildId: session.guildId, ...body });
});
