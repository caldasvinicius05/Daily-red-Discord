import { handle, requireSession } from "../_lib/http";

export const dynamic = "force-dynamic";

/** The server's day at a glance (streak, champions defeated, today's top). Null outside a server. */
export const GET = handle(async ({ app, request }) => {
  const session = requireSession(request);
  if (!session.guildId) return null;
  return app.getServerSummary({ guildId: session.guildId });
});
