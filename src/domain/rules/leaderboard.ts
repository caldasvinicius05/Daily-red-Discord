import type { BattleResult } from "../entities";

export interface RankableResult {
  result: BattleResult;
  finishedAt: Date;
}

/**
 * Ranking for a day's board:
 * wins first (more Pokémon left, then fewer turns), then losses (more of Red's team
 * knocked out), abandoned games last. Ties go to whoever finished first.
 */
export function compareResults(a: RankableResult, b: RankableResult): number {
  return (
    tier(a.result) - tier(b.result) ||
    score(b.result) - score(a.result) ||
    (a.result.won ? a.result.turns - b.result.turns : 0) ||
    a.finishedAt.getTime() - b.finishedAt.getTime()
  );
}

function tier(r: BattleResult): number {
  if (r.won) return 0;
  return r.abandoned ? 2 : 1;
}

function score(r: BattleResult): number {
  return r.won ? r.playerAlive.filter(Boolean).length : r.redFainted.filter(Boolean).length;
}

export function rankResults<T extends RankableResult>(entries: readonly T[]): (T & { rank: number })[] {
  return [...entries].sort(compareResults).map((entry, i) => ({ ...entry, rank: i + 1 }));
}
