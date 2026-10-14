import type { Pokemon } from "pokemon-showdown";
import { dex } from "./generation";

/**
 * A move's display name and type for a given Pokémon. Showdown keeps Hidden Power as the
 * generic "hiddenpower" (Normal-typed, shown as "Hidden Power Ice 70"); its real type
 * comes from the Pokémon's IVs, so it is resolved to "Hidden Power Ice" / Ice here.
 */
export function moveIdentity(pokemon: Pokemon | null | undefined, moveId: string): { name: string; type: string } {
  if (moveId.startsWith("hiddenpower") && pokemon) {
    return { name: `Hidden Power ${pokemon.hpType}`, type: pokemon.hpType };
  }
  const move = dex.moves.get(moveId);
  return { name: move.name, type: move.type };
}
