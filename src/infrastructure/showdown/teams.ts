import type { PokemonSet as ShowdownSet } from "pokemon-showdown/dist/sim/teams";
import type { PokemonSet } from "@/domain";

const PERFECT_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const NO_EVS = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

/**
 * Our set → Showdown set. The nickname is the species so log lines can be mapped back
 * to a Pokémon, and gender is fixed so it never consumes the battle's RNG.
 */
export function toShowdownSet(set: PokemonSet): ShowdownSet {
  return {
    name: set.species,
    species: set.species,
    item: set.item,
    ability: set.ability,
    nature: set.nature,
    moves: [...set.moves],
    evs: { ...NO_EVS, ...set.evs },
    ivs: { ...PERFECT_IVS },
    level: 100,
    gender: "M",
  };
}
