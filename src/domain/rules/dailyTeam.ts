import { DATA_VERSION } from "../data/champions";
import type { GameDate } from "../entities";
import { createRandom, shuffle } from "./random";

export const TEAM_SIZE = 6;

/**
 * The six species everyone gets on a given date, drawn from the player pool.
 * Pure and deterministic; the builds for them are generated elsewhere.
 */
export function pickDailySpecies(date: GameDate, pool: readonly string[]): string[] {
  if (pool.length < TEAM_SIZE) throw new Error(`Pool needs at least ${TEAM_SIZE} Pokémon`);
  return shuffle(pool, createRandom(`${date}:team:v${DATA_VERSION}`)).slice(0, TEAM_SIZE);
}
