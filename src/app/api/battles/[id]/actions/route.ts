import { z } from "zod";
import { handle, parseBody, playerActionSchema, requireSession } from "../../../_lib/http";

export const dynamic = "force-dynamic";

export const POST = handle(async ({ app, request }, ctx: RouteContext<"/api/battles/[id]/actions">) => {
  const { id } = await ctx.params;
  const playerId = requireSession(request).playerId;
  const { action } = await parseBody(request, z.object({ action: playerActionSchema }));
  return app.submitAction({ playerId, battleId: id, action });
});
