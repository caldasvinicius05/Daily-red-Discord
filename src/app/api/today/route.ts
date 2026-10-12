import { handle, requireSession } from "../_lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async ({ app, request }) => app.getToday(requireSession(request).playerId));
