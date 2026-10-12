import { describe, expect, it } from "vitest";
import type { BattleResult } from "../entities";
import { pickChampion, weekStart } from "./championRotation";
import { pickDailySpecies } from "./dailyTeam";
import { addDays, challengeNumber, msUntilNextDay, toGameDate } from "./gameDate";
import { createRandom } from "./random";
import { buildShareText } from "./share";
import { computeStats } from "./stats";

describe("random", () => {
  it("is deterministic per seed", () => {
    const a = createRandom("x");
    const b = createRandom("x");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(createRandom("y")()).not.toBe(createRandom("x")());
  });
});

describe("gameDate", () => {
  it("uses the fixed time zone, not UTC", () => {
    // 02:00 UTC on the 13th is still 23:00 on the 12th in São Paulo (UTC-3).
    expect(toGameDate(new Date("2026-10-13T02:00:00Z"))).toBe("2026-10-12");
    expect(toGameDate(new Date("2026-10-13T03:30:00Z"))).toBe("2026-10-13");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("numbers challenges from launch day", () => {
    expect(challengeNumber("2026-10-12")).toBe(1);
    expect(challengeNumber("2026-10-20")).toBe(9);
  });

  it("counts down to local midnight", () => {
    const ms = msUntilNextDay(new Date("2026-10-13T02:00:00Z"));
    expect(Math.round(ms / 60_000)).toBe(60);
  });
});

const POOL = Array.from({ length: 40 }, (_, i) => `Mon${i}`);

describe("daily species", () => {
  it("is the same for everyone on a given day", () => {
    expect(pickDailySpecies("2026-10-12", POOL)).toEqual(pickDailySpecies("2026-10-12", POOL));
  });

  it("has six distinct Pokémon and changes between days", () => {
    const team = pickDailySpecies("2026-10-12", POOL);
    expect(new Set(team).size).toBe(6);
    expect(pickDailySpecies("2026-10-13", POOL)).not.toEqual(team);
  });
});

describe("champion rotation", () => {
  it("weeks start on Monday", () => {
    expect(weekStart("2026-10-12")).toBe("2026-10-12"); // Monday
    expect(weekStart("2026-10-18")).toBe("2026-10-12"); // Sunday
    expect(weekStart("2026-10-19")).toBe("2026-10-19"); // next Monday
    expect(weekStart("2026-11-01")).toBe("2026-10-26"); // across a month
  });

  it("never repeats a champion within the week while there are unused ones", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g"];
    const random = createRandom("rotation");
    const week: string[] = [];
    for (let day = 0; day < 7; day++) week.push(pickChampion(ids, week, random));
    expect([...week].sort()).toEqual(ids);
  });

  it("allows repeats only once every champion was used", () => {
    expect(pickChampion(["a", "b"], ["a", "b"], () => 0.99)).toBe("b");
    expect(pickChampion(["a", "b"], ["a"], () => 0.99)).toBe("b");
  });
});

const result = (date: string, won: boolean): BattleResult => ({
  date,
  won,
  turns: 20,
  playerAlive: [true, true, false, false, false, false],
  redFainted: [true, true, true, true, true, true],
  abandoned: false,
});

describe("stats", () => {
  it("is empty with no games", () => {
    expect(computeStats([], "2026-10-12")).toEqual({
      played: 0, wins: 0, winRate: 0, winStreak: 0, bestWinStreak: 0, dayStreak: 0,
    });
  });

  it("keeps streaks alive until a full day is missed", () => {
    const games = [result("2026-10-10", true), result("2026-10-11", true)];
    expect(computeStats(games, "2026-10-12")).toMatchObject({ winStreak: 2, dayStreak: 2 });
    expect(computeStats(games, "2026-10-13")).toMatchObject({ winStreak: 0, dayStreak: 0, bestWinStreak: 2 });
  });

  it("a loss breaks the win streak but not the day streak", () => {
    const games = [result("2026-10-10", true), result("2026-10-11", false), result("2026-10-12", true)];
    expect(computeStats(games, "2026-10-12")).toMatchObject({
      played: 3, wins: 2, winRate: 67, winStreak: 1, bestWinStreak: 1, dayStreak: 3,
    });
  });
});

describe("share text", () => {
  it("shows survivors on a win", () => {
    expect(buildShareText(result("2026-10-12", true), 1, 3, "Lance")).toBe(
      "Daily Battle #1 — venci Lance! 🏆\n🟩🟩⬛⬛⬛⬛ 2/6 de pé · 20 turnos\n🔥 Sequência: 3",
    );
  });

  it("shows knockouts on a loss", () => {
    const lost = { ...result("2026-10-12", false), redFainted: [true, false, false, false, false, false] };
    expect(buildShareText(lost, 4, 0, "Steven")).toBe("Daily Battle #4 — Steven venceu 💀\n🟥⬛⬛⬛⬛⬛ 1/6 derrubados · 20 turnos");
  });
});
