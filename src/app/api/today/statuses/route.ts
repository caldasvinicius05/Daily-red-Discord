import { z } from "zod";
import { MAX_STATUS_LOOKUP } from "@/application/useCases";
import { handle, parseBody, requireSession } from "../../_lib/http";

export const dynamic = "force-dynamic";

const schema = z.object({
  playerIds: z.array(z.string().min(1).max(40)).max(MAX_STATUS_LOOKUP),
});

/** Today's daily status of the given players (the people currently in the Activity). */
export const POST = handle(async ({ app, request }) => {
  requireSession(request);
  const { playerIds } = await parseBody(request, schema);
  return app.getDailyStatuses(playerIds);
});
