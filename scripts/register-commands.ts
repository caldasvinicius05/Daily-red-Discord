/**
 * Registers (or updates) the `/dailybattle` slash command for this app, and removes the
 * old `/dailyred` if it is still there. Run once, and again whenever the command's
 * name, description or options change:
 *   npm run register-commands
 *
 * Uses the client-credentials grant, so only CLIENT_ID and CLIENT_SECRET from .env
 * are needed. Commands are created/deleted one by one (never a bulk overwrite), so the
 * Activity's "Launch" entry point command is kept.
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
const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

const command = {
  name: "dailybattle",
  description: "Mostra o ranking de hoje do Daily Battle neste servidor",
  type: 1, // CHAT_INPUT (slash command)
  contexts: [0], // only inside servers
  integration_types: [0], // installed to a server
};

const response = await fetch(`${API}/applications/${clientId}/commands`, { method: "POST", headers, body: JSON.stringify(command) });
if (!response.ok) throw new Error(`Falha ao registrar /dailybattle (${response.status}): ${await response.text()}`);
console.log("✓ Comando /dailybattle registrado.");

// Clean up the command from before the rename.
const existing = (await (await fetch(`${API}/applications/${clientId}/commands`, { headers })).json()) as { id: string; name: string }[];
const old = existing.find((c) => c.name === "dailyred");
if (old) {
  const removed = await fetch(`${API}/applications/${clientId}/commands/${old.id}`, { method: "DELETE", headers });
  console.log(removed.ok ? "✓ Comando antigo /dailyred removido." : `! Não foi possível remover /dailyred (${removed.status}).`);
}

console.log("Pode levar alguns instantes para os comandos atualizarem no Discord.");
