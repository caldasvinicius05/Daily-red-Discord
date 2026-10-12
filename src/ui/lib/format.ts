import { GAME_TIME_ZONE } from "@/domain/rules/gameDate";

// Intl formatters are costly to build; create each once and reuse it.
const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: GAME_TIME_ZONE,
});
const clockTime = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: GAME_TIME_ZONE });

/** "Segunda-feira, 12 de outubro" */
export function formatGameDate(date: string): string {
  const text = longDate.format(new Date(`${date}T12:00:00-03:00`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "08:04:59" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatDex(num: number): string {
  return `#${String(num).padStart(4, "0")}`;
}

export function formatTime(iso: string): string {
  return clockTime.format(new Date(iso));
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
