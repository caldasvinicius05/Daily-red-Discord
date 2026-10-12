import { createUseCases, type UseCases } from "@/application/useCases";
import { config, discordConfigured } from "./config";
import { createDatabase, prepareDatabase } from "./db/client";
import { DrizzleBattleRepository, DrizzleDailyChampionRepository, DrizzlePlayerRepository } from "./db/drizzleRepositories";
import { HttpDiscordGateway, unavailableDiscordGateway } from "./discord/discordGateway";
import { ShowdownBattleEngine } from "./showdown/ShowdownBattleEngine";
import { ShowdownPokedex } from "./showdown/ShowdownPokedex";
import { ShowdownTeamFactory } from "./showdown/ShowdownTeamFactory";
import { systemClock, uuidGenerator } from "./system";

/**
 * Composition root: the only place that knows which adapter implements each port.
 * Cached on globalThis so Next's dev hot-reload doesn't open a new DB connection per edit.
 */
const globalCache = globalThis as unknown as { __dailyRed?: Promise<UseCases> };

async function build(): Promise<UseCases> {
  const db = createDatabase(config.databaseUrl, config.databaseAuthToken);
  await prepareDatabase(db, config.databaseUrl);
  return createUseCases({
    engine: new ShowdownBattleEngine(),
    teams: new ShowdownTeamFactory(),
    battles: new DrizzleBattleRepository(db),
    dailyChampions: new DrizzleDailyChampionRepository(db),
    players: new DrizzlePlayerRepository(db),
    discord: discordConfigured()
      ? new HttpDiscordGateway(config.discordClientId, config.discordClientSecret)
      : unavailableDiscordGateway,
    pokedex: new ShowdownPokedex(),
    clock: systemClock,
    ids: uuidGenerator,
    random: Math.random,
  });
}

export function getUseCases(): Promise<UseCases> {
  globalCache.__dailyRed ??= build().catch((error) => {
    // Don't cache a failed startup (e.g. DB unreachable): retry on the next request.
    globalCache.__dailyRed = undefined;
    throw error;
  });
  return globalCache.__dailyRed;
}
