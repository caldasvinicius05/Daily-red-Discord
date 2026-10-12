import type { BattleResult, GameDate, PlayerStats } from "../entities";
import { addDays } from "./gameDate";

/**
 * Builds stats from a player's daily results (practice never counts).
 * `today` decides whether streaks are still alive: a streak survives until the
 * player misses a whole day, so yesterday's result still counts this morning.
 */
export function computeStats(results: readonly BattleResult[], today: GameDate): PlayerStats {
  const byDate = new Map<GameDate, BattleResult>();
  for (const r of results) byDate.set(r.date, r);
  const dates = [...byDate.keys()].sort();

  const played = dates.length;
  const wins = dates.filter((d) => byDate.get(d)!.won).length;

  let bestWinStreak = 0;
  let run = 0;
  let prev: GameDate | null = null;
  for (const d of dates) {
    const consecutive = prev !== null && addDays(prev, 1) === d;
    run = byDate.get(d)!.won ? (consecutive ? run + 1 : 1) : 0;
    bestWinStreak = Math.max(bestWinStreak, run);
    prev = d;
  }

  // Current streaks are counted backwards from today (or yesterday if today isn't played yet).
  let cursor = byDate.has(today) ? today : addDays(today, -1);
  let dayStreak = 0;
  let winStreak = 0;
  let winsUnbroken = true;
  while (byDate.has(cursor)) {
    dayStreak++;
    if (winsUnbroken && byDate.get(cursor)!.won) winStreak++;
    else winsUnbroken = false;
    cursor = addDays(cursor, -1);
  }

  return {
    played,
    wins,
    winRate: played === 0 ? 0 : Math.round((wins / played) * 100),
    winStreak,
    bestWinStreak,
    dayStreak,
  };
}
