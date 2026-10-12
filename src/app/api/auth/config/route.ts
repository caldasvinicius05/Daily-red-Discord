import { config, discordConfigured } from "@/infrastructure/config";
import { handle } from "../../_lib/http";

export const dynamic = "force-dynamic";

/** Tells the client which login methods exist, so it can show the right screen. */
export const GET = handle(async () => ({
  discord: discordConfigured(),
  devLogin: config.devLoginEnabled,
}));
