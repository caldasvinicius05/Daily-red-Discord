import type { GameDate } from "../entities";
import { addDays } from "./gameDate";

/**
 * Days in a row the server played the daily (someone from it finished one), like
 * Wordle's group streak. Counts back from `today`; a day nobody has played yet doesn't
 * break the streak until it is over, so it may also end yesterday.
 */
export function serverStreak(playedDates: readonly GameDate[], today: GameDate): number {
  const played = new Set(playedDates);
  let day = played.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (played.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
