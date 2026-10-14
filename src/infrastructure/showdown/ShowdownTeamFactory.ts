import type { TeamFactory } from "@/application/ports";
import { DATA_VERSION, pickDailySpecies, type GameDate, type PokemonSet, type StatSpread, type Team } from "@/domain";
import { createRandom } from "@/domain/rules/random";
import smogonSets from "./data/smogon-sets.gen4.json";
import { dex, LAST_DEX_NUMBER } from "./generation";

const LEGENDARY_TAGS = ["Restricted Legendary", "Sub-Legendary", "Mythical"];

type Species = ReturnType<typeof dex.species.get>;

/** A Smogon set, already resolved to one choice per slot (see scripts/update-smogon-sets.ts). */
interface CompetitiveSet {
  name: string;
  format: string;
  item: string;
  ability: string;
  nature: string;
  evs: Partial<StatSpread>;
  ivs?: Partial<StatSpread>;
  moves: string[];
}

const SETS = smogonSets as Record<string, CompetitiveSet[]>;

/**
 * Items that lock the holder into a single move (the Choice items). Competitive, but
 * they make the daily team feel restrictive, so they become Leftovers — a common
 * second choice on those sets, and one that keeps all four moves usable.
 */
const MOVE_LOCKING_ITEMS = new Set(["Choice Band", "Choice Specs", "Choice Scarf"]);
const LOCKING_ITEM_REPLACEMENT = "Leftovers";

function playableItem(item: string): string {
  return MOVE_LOCKING_ITEMS.has(item) ? LOCKING_ITEM_REPLACEMENT : item;
}

/** A species' sets the player can actually use: at least two moves (rules out Unown and Ditto). */
function playableSets(species: string): CompetitiveSet[] {
  return (SETS[species] ?? []).filter((set) => set.moves.length >= 2);
}

function isFinalForm(species: Species): boolean {
  // Evolutions from later generations (Sylveon, Annihilape...) don't count.
  return !(species.evos ?? []).some((evo: string) => {
    const next = dex.species.get(evo);
    return next.exists && next.num <= LAST_DEX_NUMBER;
  });
}

/**
 * Every fully evolved, non-legendary Pokémon up to Gen 4 (base formes only) that has a
 * competitive set. Pokémon that gained an evolution in Gen 4 are replaced by it (Murkrow →
 * Honchkrow, Electabuzz → Electivire). Pikachu is out (it evolves); Raichu is in.
 */
export function buildPlayerPool(): string[] {
  return dex.species
    .all()
    .filter(
      (s) =>
        s.exists &&
        s.num >= 1 &&
        s.num <= LAST_DEX_NUMBER &&
        !s.forme &&
        s.baseSpecies === s.name &&
        !s.tags.some((t) => LEGENDARY_TAGS.includes(t)) &&
        isFinalForm(s) &&
        playableSets(s.name).length > 0,
    )
    .map((s) => s.name)
    .sort();
}

/**
 * The day's team: species picked by the domain rule, each with one of its Smogon sets
 * (Gen 4 singles analyses: moves, item, ability, nature, EVs and IVs), drawn with the
 * date as seed so everyone gets the same builds. Sets with Choice items are only used
 * when the species has nothing else. All at level 100.
 */
export class ShowdownTeamFactory implements TeamFactory {
  private readonly pool = buildPlayerPool();
  private readonly cache = new Map<GameDate, Team>();

  poolSpecies(): readonly string[] {
    return this.pool;
  }

  dailyTeam(date: GameDate): Team {
    const cached = this.cache.get(date);
    if (cached) return structuredClone(cached);

    const team = pickDailySpecies(date, this.pool).map((species) => this.pickSet(date, species));

    if (this.cache.size > 30) this.cache.clear();
    this.cache.set(date, team);
    return structuredClone(team);
  }

  private pickSet(date: GameDate, species: string): PokemonSet {
    const sets = playableSets(species);
    const free = sets.filter((set) => !MOVE_LOCKING_ITEMS.has(set.item));
    const options = free.length > 0 ? free : sets;
    const random = createRandom(`${date}:set:${species}:v${DATA_VERSION}`);
    const chosen = options[Math.floor(random() * options.length)]!;
    return {
      species,
      item: playableItem(chosen.item),
      ability: chosen.ability,
      nature: chosen.nature,
      evs: { ...chosen.evs },
      ...(chosen.ivs ? { ivs: { ...chosen.ivs } } : {}),
      moves: [...chosen.moves],
    };
  }
}
