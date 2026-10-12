import { Dex } from "pokemon-showdown";
import type { MoveInfo, Pokedex, SpeciesInfo } from "@/application/ports";

const gen3 = Dex.forGen(3);

/** Before Gen 4, whether a move is physical or special depended only on its type. */
const SPECIAL_TYPES = new Set(["Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark"]);

export class ShowdownPokedex implements Pokedex {
  species(name: string): SpeciesInfo {
    const s = gen3.species.get(name);
    if (!s.exists) throw new Error(`Unknown species: ${name}`);
    return { num: s.num, types: [...s.types], baseStats: { ...s.baseStats } };
  }

  move(name: string): MoveInfo {
    const m = gen3.moves.get(name);
    if (!m.exists) throw new Error(`Unknown move: ${name}`);
    const category = m.category === "Status" ? "Status" : SPECIAL_TYPES.has(m.type) ? "Special" : "Physical";
    return {
      type: m.type,
      category,
      power: m.basePower,
      accuracy: m.accuracy,
      priority: m.priority,
      description: m.shortDesc || m.desc,
    };
  }

  itemDescription(name: string): string {
    const item = gen3.items.get(name);
    return item.shortDesc || item.desc || "";
  }

  abilityDescription(name: string): string {
    const ability = gen3.abilities.get(name);
    return ability.shortDesc || ability.desc || "";
  }

  allMoves(): readonly string[] {
    return gen3.moves.all().filter((m) => m.exists && m.gen <= 3 && !m.isNonstandard).map((m) => m.name);
  }

  allItems(): readonly string[] {
    return gen3.items.all().filter((i) => i.exists && i.gen <= 3 && !i.isNonstandard).map((i) => i.name);
  }

  allAbilities(): readonly string[] {
    return gen3.abilities.all().filter((a) => a.exists && a.gen <= 3 && a.num > 0 && !a.isNonstandard).map((a) => a.name);
  }
}
