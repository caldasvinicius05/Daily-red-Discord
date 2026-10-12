import type { PokemonSet as ShowdownSet } from "pokemon-showdown/dist/sim/teams";
import type { PokemonSet } from "@/domain";
import { slotNickname } from "./logParser";

const PERFECT_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
const NO_EVS = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

/**
 * Our set → Showdown set. The nickname is the team slot (`m0`…`m5`), so log lines can be
 * mapped back to one exact Pokémon even when a team repeats a species, and gender is
 * fixed so it never consumes the battle's RNG.
 */
export function toShowdownSet(set: PokemonSet, slot: number): ShowdownSet {
  return {
    name: slotNickname(slot),
    species: set.species,
    item: set.item,
    ability: set.ability,
    nature: set.nature,
    moves: [...set.moves],
    evs: { ...NO_EVS, ...set.evs },
    ivs: { ...PERFECT_IVS, ...set.ivs },
    level: 100,
    gender: "M",
  };
}
