import { TeamValidator } from "pokemon-showdown";
import { describe, expect, it } from "vitest";
import { addDays, type PokemonSet } from "@/domain";
import { ShowdownTeamFactory } from "./ShowdownTeamFactory";

const validator = TeamValidator.get("gen4ubers");
const full = (stats: object | undefined, fill: number) => ({ hp: fill, atk: fill, def: fill, spa: fill, spd: fill, spe: fill, ...stats });
const validate = (set: PokemonSet) =>
  validator.validateTeam([{ ...set, name: set.species, evs: full(set.evs, 0), ivs: full(set.ivs, 31), level: 100, gender: "" }] as never) ?? [];

const factory = new ShowdownTeamFactory();
const days = Array.from({ length: 120 }, (_, i) => addDays("2026-10-12", i));

describe("ShowdownTeamFactory", () => {
  it("draws from fully evolved, non-legendary Pokémon up to Gen 4", () => {
    const pool = factory.poolSpecies();
    expect(pool).toHaveLength(227);
    expect(pool).toContain("Raichu");
    expect(pool).not.toContain("Pikachu"); // evolves; exclusive to Red
    expect(pool).not.toContain("Charmeleon");
    expect(pool).not.toContain("Mewtwo");
    expect(pool).not.toContain("Arceus");
    expect(pool).toContain("Garchomp");
    expect(pool).not.toContain("Unown"); // a single move
    expect(pool).not.toContain("Ditto"); // a single move
  });

  it("replaces Pokémon that gained an evolution in Gen 4 by that evolution", () => {
    const pool = factory.poolSpecies();
    for (const [old, evolved] of [
      ["Murkrow", "Honchkrow"],
      ["Electabuzz", "Electivire"],
      ["Magneton", "Magnezone"],
      ["Togetic", "Togekiss"],
      ["Porygon2", "Porygon-Z"],
      ["Dusclops", "Dusknoir"],
    ]) {
      expect(pool).not.toContain(old);
      expect(pool).toContain(evolved);
    }
  });

  it("gives everyone the same team on the same day", () => {
    expect(new ShowdownTeamFactory().dailyTeam("2026-10-12")).toEqual(factory.dailyTeam("2026-10-12"));
  });

  it("never hands out items that lock the Pokémon into one move", () => {
    const items = days.flatMap((day) => factory.dailyTeam(day).map((set) => set.item));
    for (const choice of ["Choice Band", "Choice Specs", "Choice Scarf"]) expect(items).not.toContain(choice);
    expect(items).toContain("Leftovers");
  });

  it("builds every Pokémon competitively: legal Smogon sets with full EVs and a chosen nature", () => {
    for (const day of days.slice(0, 40)) {
      for (const set of factory.dailyTeam(day)) {
        expect(validate(set), `${day} ${set.species}`).toEqual([]);
        const evs = Object.values(set.evs).reduce((a, b) => a + (b ?? 0), 0);
        expect(evs, `${day} ${set.species}`).toBeGreaterThanOrEqual(480);
        expect(set.moves.length).toBeGreaterThanOrEqual(2);
      }
    }
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
