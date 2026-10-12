import { PLAYER_POOL, POOL_VERSION } from "../data/pool";
import type { DailyChallenge, GameDate, PokemonSet, Team } from "../entities";
import { challengeNumber } from "./gameDate";
import { createRandom, shuffle } from "./random";

export const TEAM_SIZE = 6;

/** Same date → same six Pokémon, for every player. */
export function generateDailyTeam(date: GameDate, pool: readonly PokemonSet[] = PLAYER_POOL): Team {
  if (pool.length < TEAM_SIZE) throw new Error(`Pool needs at least ${TEAM_SIZE} Pokémon`);
  const random = createRandom(`${date}:team:v${POOL_VERSION}`);
  return shuffle(pool, random).slice(0, TEAM_SIZE);
}

export function getDailyChallenge(date: GameDate): DailyChallenge {
  return { date, number: challengeNumber(date), team: generateDailyTeam(date) };
}
