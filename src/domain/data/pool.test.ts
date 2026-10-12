import { Dex, TeamValidator } from "pokemon-showdown";
import { describe, expect, it } from "vitest";
import type { PokemonSet } from "../entities";
import { PLAYER_POOL, RED_TEAM } from "./pool";

const validator = TeamValidator.get("gen3ubers");

function toShowdownSet(set: PokemonSet) {
  return {
    name: set.species,
    species: set.species,
    item: set.item,
    ability: set.ability,
    nature: set.nature,
    moves: [...set.moves],
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...set.evs },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: 100,
    gender: "",
  };
}

describe.each([
  ["player pool", PLAYER_POOL],
  ["Red's team", RED_TEAM],
])("%s", (_label, sets) => {
  it.each(sets.map((s) => [s.species, s] as const))("%s is a legal Gen 3 set", (_name, set) => {
    const problems = validator.validateTeam([toShowdownSet(set)]);
    expect(problems ?? []).toEqual([]);
  });

  it("has no duplicate species", () => {
    const names = sets.map((s) => s.species);
    expect(new Set(names).size).toBe(names.length);
  });

  it("only uses Gen 1–3 species", () => {
    for (const s of sets) expect(Dex.species.get(s.species).num).toBeLessThanOrEqual(386);
  });
});

it("the player pool has 30 Pokémon and Red has 6", () => {
  expect(PLAYER_POOL).toHaveLength(30);
  expect(RED_TEAM).toHaveLength(6);
});
