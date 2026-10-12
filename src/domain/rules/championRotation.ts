import type { GameDate } from "../entities";
import { addDays } from "./gameDate";

/** Monday of the week `date` belongs to (weeks run Monday–Sunday). */
export function weekStart(date: GameDate): GameDate {
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dayOfWeek + 6) % 7));
}

/**
 * Picks today's champion among those that haven't appeared yet this week, in a random
 * order. With fewer champions than days, a new round starts once everyone has shown up
 * (still without repeats inside the round), and the first pick of that round is never
 * the champion of the day before.
 */
export function pickChampion(allIds: readonly string[], usedThisWeek: readonly string[], random: () => number): string {
  if (allIds.length === 0) throw new Error("No champions to pick from");
  const round = new Set<string>();
  for (const id of usedThisWeek) {
    if (!allIds.includes(id)) continue;
    round.add(id);
    if (round.size === allIds.length) round.clear();
  }
  const last = usedThisWeek.at(-1);
  let pool = allIds.filter((id) => !round.has(id));
  if (round.size === 0 && allIds.length > 1) pool = pool.filter((id) => id !== last);
  return pool[Math.floor(random() * pool.length)]!;
}
