import type { GameDate } from "../entities";

/** Every player shares the same day, so "today" is computed in one fixed zone. */
export const GAME_TIME_ZONE = "America/Sao_Paulo";

/** Day #1 of the challenge. */
export const LAUNCH_DATE: GameDate = "2026-10-12";

const DAY_MS = 86_400_000;

// Building a time-zone-aware Intl formatter is expensive; build one per zone and reuse it.
const formatters = new Map<string, Intl.DateTimeFormat>();

export function toGameDate(instant: Date, timeZone: string = GAME_TIME_ZONE): GameDate {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    // en-CA formats as YYYY-MM-DD.
    formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(timeZone, formatter);
  }
  return formatter.format(instant);
}

function toUtcDay(date: GameDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!) / DAY_MS;
}

export function addDays(date: GameDate, days: number): GameDate {
  return new Date((toUtcDay(date) + days) * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: GameDate, to: GameDate): number {
  return toUtcDay(to) - toUtcDay(from);
}

/** Puzzle number shown to players: launch day is #1. */
export function challengeNumber(date: GameDate): number {
  return daysBetween(LAUNCH_DATE, date) + 1;
}

/** Milliseconds until the next game day starts, for the countdown. */
export function msUntilNextDay(now: Date, timeZone: string = GAME_TIME_ZONE): number {
  const today = toGameDate(now, timeZone);
  // Walk forward minute-by-minute is too slow; binary search the boundary within the next 26h (DST-safe).
  let lo = now.getTime();
  let hi = lo + 26 * 3_600_000;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (toGameDate(new Date(mid), timeZone) === today) lo = mid;
    else hi = mid;
  }
  return hi - now.getTime();
}
