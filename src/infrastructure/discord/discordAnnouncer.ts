import type { DailyAnnouncement, DailyAnnouncer, ServerSummary } from "@/application/ports";
import { dailySummaryMessage } from "./messages";

const API = "https://discord.com/api/v10";
const TIMEOUT_MS = 5000;

/** Posts and edits the day's results message as the app's bot (needs `BOT_TOKEN`). */
export class DiscordBotAnnouncer implements DailyAnnouncer {
  constructor(
    private readonly botToken: string,
    private readonly cardUrl: (summary: ServerSummary) => string | null,
  ) {}

  async publish(summary: ServerSummary, target: { channelId: string; messageId: string | null }): Promise<DailyAnnouncement | null> {
    const body = JSON.stringify(dailySummaryMessage(summary, this.cardUrl(summary)));
    const { channelId, messageId } = target;

    if (messageId) {
      const edited = await this.call("PATCH", `/channels/${channelId}/messages/${messageId}`, body);
      if (edited.ok) return { channelId, messageId };
      // Deleted message: post a new one below.
      if (edited.status !== 404) throw new Error(`Discord recusou a edição (${edited.status})`);
    }

    const posted = await this.call("POST", `/channels/${channelId}/messages`, body);
    if (!posted.ok) throw new Error(`Discord recusou a mensagem (${posted.status}): ${await posted.text()}`);
    const { id } = (await posted.json()) as { id: string };
    return { channelId, messageId: id };
  }

  private call(method: "POST" | "PATCH", path: string, body: string): Promise<Response> {
    return fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bot ${this.botToken}`, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}

/** Used when no bot token is configured: results are only shown inside the Activity. */
export const silentAnnouncer: DailyAnnouncer = {
  publish: async () => null,
};
