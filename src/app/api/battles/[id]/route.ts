import { handle, requireSession } from "../../_lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async ({ app, request }, ctx: RouteContext<"/api/battles/[id]">) => {
  const { id } = await ctx.params;
  return app.getBattle({ playerId: requireSession(request).playerId, battleId: id });
});
