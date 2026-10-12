import type { MoveInfo, Pokedex, SpeciesInfo } from "@/application/ports";
import { dex, GEN } from "./generation";

export class ShowdownPokedex implements Pokedex {
  species(name: string): SpeciesInfo {
    const s = dex.species.get(name);
    if (!s.exists) throw new Error(`Unknown species: ${name}`);
    return { num: s.num, types: [...s.types], baseStats: { ...s.baseStats } };
  }

  move(name: string): MoveInfo {
    const m = dex.moves.get(name);
    if (!m.exists) throw new Error(`Unknown move: ${name}`);
    return {
      type: m.type,
      // From Gen 4 on, each move has its own category.
      category: m.category,
      power: m.basePower,
      accuracy: m.accuracy,
      priority: m.priority,
      description: m.shortDesc || m.desc,
    };
  }

  itemDescription(name: string): string {
    const item = dex.items.get(name);
    return item.shortDesc || item.desc || "";
  }

  abilityDescription(name: string): string {
    const ability = dex.abilities.get(name);
    return ability.shortDesc || ability.desc || "";
  }

  allMoves(): readonly string[] {
    return dex.moves.all().filter((m) => m.exists && m.gen <= GEN && !m.isNonstandard).map((m) => m.name);
  }

  allItems(): readonly string[] {
    return dex.items.all().filter((i) => i.exists && i.gen <= GEN && !i.isNonstandard).map((i) => i.name);
  }

  allAbilities(): readonly string[] {
    return dex.abilities.all().filter((a) => a.exists && a.gen <= GEN && a.num > 0 && !a.isNonstandard).map((a) => a.name);
  }
}
