import type { BattleMode, PlayerAction } from "@/domain";
import type {
  AuthConfigDTO,
  BattleDTO,
  LeaderboardDTO,
  PlayerDTO,
  ReferenceDTO,
  SessionDTO,
  StatusesDTO,
  TodayDTO,
} from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

let sessionToken: string | null = null;

export function setSessionToken(token: string | null): void {
  sessionToken = token;
}

/**
 * Relative URLs on purpose: inside Discord the Activity is served from
 * `<app-id>.discordsays.com`, which proxies `/api` to our server.
 */
async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (sessionToken) headers.authorization = `Bearer ${sessionToken}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(0, "network", "Sem conexão com o servidor");
  }

  const data = (await response.json().catch(() => null)) as (T & { error?: { code: string; message: string } }) | null;
  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.code ?? "internal", data?.error?.message ?? "Erro inesperado");
  }
  return data as T;
}

export const api = {
  authConfig: () => request<AuthConfigDTO>("GET", "/auth/config"),
  devLogin: (name: string) => request<SessionDTO>("POST", "/auth/dev", { name }),
  discordLogin: (code: string, guildId: string | null) =>
    request<SessionDTO & { accessToken: string }>("POST", "/auth/discord", { code, guildId }),
  me: () => request<{ player: PlayerDTO; guildId: string | null }>("GET", "/me"),
  reference: () => request<ReferenceDTO>("GET", "/reference"),
  today: () => request<TodayDTO>("GET", "/today"),
  leaderboard: (date?: string) => request<LeaderboardDTO>("GET", `/leaderboard${date ? `?date=${date}` : ""}`),
  statuses: (playerIds: string[]) => request<StatusesDTO>("POST", "/today/statuses", { playerIds }),
  startBattle: (mode: BattleMode, leadIndex: number) => request<BattleDTO>("POST", "/battles", { mode, leadIndex }),
  getBattle: (id: string) => request<BattleDTO>("GET", `/battles/${encodeURIComponent(id)}`),
  act: (id: string, action: PlayerAction) =>
    request<BattleDTO>("POST", `/battles/${encodeURIComponent(id)}/actions`, { action }),
  forfeit: (id: string) => request<BattleDTO>("POST", `/battles/${encodeURIComponent(id)}/forfeit`),
};
