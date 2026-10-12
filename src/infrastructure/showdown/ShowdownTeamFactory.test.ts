import { describe, expect, it } from "vitest";
import { addDays } from "@/domain";
import { ShowdownTeamFactory } from "./ShowdownTeamFactory";

const factory = new ShowdownTeamFactory();
const days = Array.from({ length: 120 }, (_, i) => addDays("2026-10-12", i));

describe("ShowdownTeamFactory", () => {
  it("draws from fully evolved, non-legendary Gen 1–3 Pokémon", () => {
    const pool = factory.poolSpecies();
    expect(pool).toHaveLength(193);
    expect(pool).toContain("Raichu");
    expect(pool).not.toContain("Pikachu"); // evolves; exclusive to Red
    expect(pool).not.toContain("Charmeleon");
    expect(pool).not.toContain("Mewtwo");
    expect(pool).toContain("Magneton"); // Magnezone only arrives in Gen 4
  });

  it("gives everyone the same team on the same day", () => {
    expect(new ShowdownTeamFactory().dailyTeam("2026-10-12")).toEqual(factory.dailyTeam("2026-10-12"));
  });

  it("never hands out items that lock the Pokémon into one move", () => {
    const items = days.flatMap((day) => factory.dailyTeam(day).map((set) => set.item));
    expect(items).not.toContain("Choice Band");
    expect(items).toContain("Leftovers");
  });

  it("builds playable sets: six distinct species, 1–4 moves each", () => {
    for (const day of days.slice(0, 30)) {
      const team = factory.dailyTeam(day);
      expect(new Set(team.map((s) => s.species)).size).toBe(6);
      for (const set of team) {
        expect(set.moves.length).toBeGreaterThanOrEqual(1);
        expect(set.moves.length).toBeLessThanOrEqual(4);
      }
    }
  });
});
