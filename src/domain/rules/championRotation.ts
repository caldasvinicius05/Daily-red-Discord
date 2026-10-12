import type { GameDate } from "../entities";
import { addDays } from "./gameDate";

/** Monday of the week `date` belongs to (weeks run Monday–Sunday). */
export function weekStart(date: GameDate): GameDate {
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dayOfWeek + 6) % 7));
}

/**
 * Picks today's champion among those that haven't appeared yet this week.
 * With seven champions and seven days each one shows up exactly once per week, in a
 * random order. If every champion was already used (e.g. fewer champions than days),
 * any of them may come back.
 */
export function pickChampion(allIds: readonly string[], usedThisWeek: readonly string[], random: () => number): string {
  if (allIds.length === 0) throw new Error("No champions to pick from");
  const used = new Set(usedThisWeek);
  const available = allIds.filter((id) => !used.has(id));
  const pool = available.length > 0 ? available : allIds;
  return pool[Math.floor(random() * pool.length)]!;
}
