import { toGameDate } from "@/domain";
import { dateSchema, handle, requireSession } from "../_lib/http";

export const dynamic = "force-dynamic";

/** The ranking of the Discord server the Activity was opened in. Empty outside a server. */
export const GET = handle(async ({ app, request }) => {
  const session = requireSession(request);
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam ? dateSchema.parse(dateParam) : undefined;
  if (!session.guildId) return { date: date ?? toGameDate(new Date()), entries: [] };
  return app.getLeaderboard({ guildId: session.guildId, ...(date ? { date } : {}) });
});
