import { TeamValidator } from "pokemon-showdown";
import { describe, expect, it } from "vitest";
import type { PokemonSet } from "../entities";
import { CHAMPIONS, getChampion, summarizeChampion } from "./champions";

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
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...set.ivs },
    level: 100,
    gender: "",
  };
}

describe.each(CHAMPIONS.map((c) => [c.id, c] as const))("%s", (_id, champion) => {
  it("has six Pokémon", () => {
    expect(champion.team).toHaveLength(6);
  });

  it.each(champion.team.map((s, i) => [`${i + 1}. ${s.species}`, s] as const))("%s is a legal Gen 3 set", (_name, set) => {
    expect(validator.validateTeam([toShowdownSet(set)]) ?? []).toEqual([]);
  });
});

describe("champions", () => {
  it("are seven, with unique ids", () => {
    expect(CHAMPIONS).toHaveLength(7);
    expect(new Set(CHAMPIONS.map((c) => c.id)).size).toBe(7);
  });

  it("include Lance's three Dragonite (duplicate species must be supported)", () => {
    expect(getChampion("lance").team.filter((s) => s.species === "Dragonite")).toHaveLength(3);
  });

  it("summarize without the sets", () => {
    expect(summarizeChampion(getChampion("red"))).toEqual({
      id: "red",
      name: "Red",
      variant: null,
      title: "Lenda do Monte Prateado",
      location: "Monte Prateado",
      team: ["Pikachu", "Espeon", "Snorlax", "Venusaur", "Charizard", "Blastoise"],
    });
    expect(() => getChampion("nobody")).toThrow();
  });
});
