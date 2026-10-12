import { UnauthorizedError } from "@/application/errors";
import type { DiscordGateway, DiscordUser } from "@/application/ports";

const API = "https://discord.com/api/v10";

/** Talks to Discord's REST API. The client secret never leaves the server. */
export class HttpDiscordGateway implements DiscordGateway {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async exchangeCode(code: string): Promise<string> {
    const response = await fetch(`${API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        code,
      }),
    });
    if (!response.ok) throw new UnauthorizedError("O Discord recusou o código de login");
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) throw new UnauthorizedError("O Discord não devolveu um token");
    return body.access_token;
  }

  async getUser(accessToken: string): Promise<DiscordUser> {
    const user = await this.get<{ id: string; username: string; global_name: string | null; avatar: string | null }>(
      "/users/@me",
      accessToken,
    );
    return { id: user.id, username: user.username, globalName: user.global_name, avatar: user.avatar };
  }

  async getGuildIds(accessToken: string): Promise<string[]> {
    const guilds = await this.get<{ id: string }[]>("/users/@me/guilds", accessToken);
    return guilds.map((g) => g.id);
  }

  private async get<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new UnauthorizedError("Não foi possível ler sua conta do Discord");
    return (await response.json()) as T;
  }
}

/** Used when the app runs without Discord credentials (local testing only). */
export const unavailableDiscordGateway: DiscordGateway = {
  exchangeCode: () => Promise.reject(new UnauthorizedError("Login com Discord não configurado")),
  getUser: () => Promise.reject(new UnauthorizedError("Login com Discord não configurado")),
  getGuildIds: () => Promise.reject(new UnauthorizedError("Login com Discord não configurado")),
};
