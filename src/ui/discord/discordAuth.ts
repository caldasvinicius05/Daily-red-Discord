"use client";

import type { DiscordSDK } from "@discord/embedded-app-sdk";
import { api } from "../api/client";
import type { SessionDTO } from "../api/types";

let sdk: DiscordSDK | null = null;

/** Discord opens Activities with `frame_id` (and other) query params; a normal browser tab has none. */
export function isInsideDiscord(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("frame_id");
}

export function getDiscordSdk(): DiscordSDK | null {
  return sdk;
}

/** Channel the Activity was opened in (where the day's results get posted); null outside Discord. */
export function getDiscordChannelId(): string | null {
  return sdk?.channelId ?? null;
}

/**
 * Opens Discord's own share dialog with the result text (plus a link to the Activity).
 * The player picks the channel or DM; nothing is posted without them confirming.
 */
export async function shareToDiscord(message: string): Promise<"sent" | "copied" | "cancelled"> {
  if (!sdk) throw new Error("Fora do Discord");
  const { didSendMessage, didCopyLink } = await sdk.commands.shareLink({ message });
  return didSendMessage ? "sent" : didCopyLink ? "copied" : "cancelled";
}

export interface ActivityParticipant {
  id: string;
  name: string;
  avatar: string | null;
}

/** People currently in this Activity instance, kept up to date as they join and leave. */
export async function watchParticipants(onChange: (participants: ActivityParticipant[]) => void): Promise<() => void> {
  if (!sdk) return () => {};
  type Raw = { id: string; username: string; global_name?: string | null; nickname?: string; avatar?: string | null; bot: boolean };
  const map = (list: Raw[]) =>
    list
      .filter((p) => !p.bot)
      .map((p) => ({ id: p.id, name: p.nickname || p.global_name || p.username, avatar: p.avatar ?? null }));

  const listener = (event: { participants: Raw[] }) => onChange(map(event.participants));
  const current = sdk;
  onChange(map((await current.commands.getInstanceConnectedParticipants()).participants));
  await current.subscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", listener);
  return () => void current.unsubscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", listener);
}

/**
 * The Embedded App SDK login handshake:
 * ready → authorize (user consents, we get a code) → our server exchanges the code
 * → authenticate the SDK with the resulting access token.
 */
export async function loginWithDiscord(): Promise<SessionDTO & { guildId: string | null }> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) throw new Error("CLIENT_ID não configurado");

  const { DiscordSDK } = await import("@discord/embedded-app-sdk");
  sdk ??= new DiscordSDK(clientId);
  await sdk.ready();

  const { code } = await sdk.commands.authorize({
    client_id: clientId,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds"],
  });

  const session = await api.discordLogin(code, sdk.guildId);
  await sdk.commands.authenticate({ access_token: session.accessToken });
  return { token: session.token, expiresAt: session.expiresAt, player: session.player, guildId: sdk.guildId };
}
