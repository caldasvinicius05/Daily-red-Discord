import { handle, requireSession } from "../../../_lib/http";

export const dynamic = "force-dynamic";

export const POST = handle(async ({ app, request }, ctx: RouteContext<"/api/battles/[id]/forfeit">) => {
  const { id } = await ctx.params;
  return app.forfeitBattle({ playerId: requireSession(request).playerId, battleId: id });
});
