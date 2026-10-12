import { createHash } from "node:crypto";

/** Server-side configuration, read once from the environment (.env at the project root). */
export const config = {
  discordClientId: process.env.CLIENT_ID ?? "",
  discordClientSecret: process.env.CLIENT_SECRET ?? "",
  /** Verifies that `/api/interactions` requests (slash commands) really come from Discord. */
  discordPublicKey: process.env.PUBLIC_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dailyred.db",
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN,
  /**
   * Signs session tokens. Falls back to a key derived from CLIENT_SECRET so local
   * setup needs nothing extra; set SESSION_SECRET explicitly in production.
   */
  sessionSecret:
    process.env.SESSION_SECRET ??
    createHash("sha256")
      .update(`daily-red-session:${process.env.CLIENT_SECRET ?? "dev-only-secret"}`)
      .digest("hex"),
  /** "Play without Discord" login. Never available in a production build unless forced. */
  devLoginEnabled: process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_LOGIN === "true",
};

export const discordConfigured = () => Boolean(config.discordClientId && config.discordClientSecret);
