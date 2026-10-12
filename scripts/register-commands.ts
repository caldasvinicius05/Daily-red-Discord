/**
 * Registers (or updates) the `/dailyred` slash command for this app.
 * Run once, and again whenever the command definition changes:
 *   npm run register-commands
 *
 * Uses the client-credentials grant, so only CLIENT_ID and CLIENT_SECRET from .env
 * are needed. Creates the single command with POST (an upsert by name) instead of
 * overwriting the whole list, so the Activity's "Launch" entry point command is kept.
 */
process.loadEnvFile(".env");

const API = "https://discord.com/api/v10";
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
if (!clientId || !clientSecret) throw new Error("CLIENT_ID e CLIENT_SECRET precisam estar no .env");

const tokenResponse = await fetch(`${API}/oauth2/token`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    // Basic auth with the app's own credentials.
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
  },
  body: new URLSearchParams({ grant_type: "client_credentials", scope: "applications.commands.update" }),
});
if (!tokenResponse.ok) throw new Error(`Falha ao obter token (${tokenResponse.status}): ${await tokenResponse.text()}`);
const { access_token: accessToken } = (await tokenResponse.json()) as { access_token: string };

const command = {
  name: "dailyred",
  description: "Mostra o ranking de hoje do Daily Red neste servidor",
  type: 1, // CHAT_INPUT (slash command)
  contexts: [0], // only inside servers
  integration_types: [0], // installed to a server
};

const response = await fetch(`${API}/applications/${clientId}/commands`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  body: JSON.stringify(command),
});
if (!response.ok) throw new Error(`Falha ao registrar /dailyred (${response.status}): ${await response.text()}`);

console.log("✓ Comando /dailyred registrado. Pode levar alguns instantes para aparecer no Discord.");
