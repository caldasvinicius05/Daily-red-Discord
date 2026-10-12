import type { Champion, PokemonSet } from "../entities";

/**
 * Bump when champions' sets or the player pool rules change: it is mixed into battle
 * seeds, so old saved battles stay tied to the data they were played with.
 */
export const DATA_VERSION = 3;

const physical = { hp: 4, atk: 252, spe: 252 };
const special = { hp: 4, spa: 252, spe: 252 };
const mixed = { atk: 128, spa: 128, spe: 252 };
const bulkyPhysical = { hp: 252, atk: 252, def: 4 };
const bulkySpecial = { hp: 252, spa: 252, spd: 4 };
const wall = { hp: 252, def: 128, spd: 128 };

const set = (s: PokemonSet): PokemonSet => s;

// ---------- Kanto (Blue) ----------

// Blue as the Viridian City Gym Leader in HeartGold/SoulSilver (the 16th badge).
const blueExeggutor = set({ species: "Exeggutor", item: "Leftovers", ability: "Chlorophyll", nature: "Modest", evs: bulkySpecial, moves: ["Psychic", "Giga Drain", "Sleep Powder", "Explosion"] });
const blueArcanine = set({ species: "Arcanine", item: "Leftovers", ability: "Intimidate", nature: "Naive", evs: mixed, moves: ["Fire Blast", "Extreme Speed", "Crunch", "Iron Tail"] });
const blueRhydon = set({ species: "Rhydon", item: "Leftovers", ability: "Rock Head", nature: "Adamant", evs: bulkyPhysical, moves: ["Earthquake", "Rock Slide", "Megahorn", "Double-Edge"] });
const blueGyarados = set({ species: "Gyarados", item: "Leftovers", ability: "Intimidate", nature: "Adamant", evs: physical, moves: ["Dragon Dance", "Double-Edge", "Earthquake", "Taunt"] });
const blueMachamp = set({ species: "Machamp", item: "Leftovers", ability: "Guts", nature: "Adamant", evs: bulkyPhysical, moves: ["Cross Chop", "Rock Slide", "Earthquake", "Bulk Up"] });
const bluePidgeot = set({ species: "Pidgeot", item: "Leftovers", ability: "Keen Eye", nature: "Jolly", evs: physical, moves: ["Return", "Aerial Ace", "Quick Attack", "Steel Wing"] });

// ---------- Johto (Lance, Red) ----------

const lanceGyarados = set({ species: "Gyarados", item: "Leftovers", ability: "Intimidate", nature: "Adamant", evs: physical, moves: ["Dragon Dance", "Return", "Earthquake", "Hyper Beam"] });
const lanceDragoniteDance = set({ species: "Dragonite", item: "Leftovers", ability: "Inner Focus", nature: "Adamant", evs: physical, moves: ["Dragon Dance", "Double-Edge", "Earthquake", "Aerial Ace"] });
const lanceDragoniteSpecial = set({ species: "Dragonite", item: "Leftovers", ability: "Inner Focus", nature: "Modest", evs: special, moves: ["Dragon Claw", "Thunderbolt", "Ice Beam", "Flamethrower"] });
const lanceDragoniteBeam = set({ species: "Dragonite", item: "Leftovers", ability: "Inner Focus", nature: "Naive", evs: mixed, moves: ["Hyper Beam", "Earthquake", "Thunder Wave", "Fire Blast"] });
const lanceAerodactyl = set({ species: "Aerodactyl", item: "Leftovers", ability: "Rock Head", nature: "Jolly", evs: physical, moves: ["Rock Slide", "Earthquake", "Double-Edge", "Aerial Ace"] });
const lanceCharizard = set({ species: "Charizard", item: "Leftovers", ability: "Blaze", nature: "Naive", evs: mixed, moves: ["Flamethrower", "Dragon Claw", "Earthquake", "Swords Dance"] });

const redPikachu = set({ species: "Pikachu", item: "Light Ball", ability: "Static", nature: "Timid", evs: special, moves: ["Thunderbolt", "Thunder Wave", "Quick Attack", "Iron Tail"] });
const redEspeon = set({ species: "Espeon", item: "Leftovers", ability: "Synchronize", nature: "Timid", evs: special, moves: ["Psychic", "Shadow Ball", "Calm Mind", "Morning Sun"] });
const redSnorlax = set({ species: "Snorlax", item: "Leftovers", ability: "Thick Fat", nature: "Adamant", evs: { hp: 252, atk: 252, spd: 4 }, moves: ["Body Slam", "Earthquake", "Shadow Ball", "Self-Destruct"] });
const redVenusaur = set({ species: "Venusaur", item: "Miracle Seed", ability: "Overgrow", nature: "Modest", evs: bulkySpecial, moves: ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Earthquake"] });
const redCharizard = set({ species: "Charizard", item: "Charcoal", ability: "Blaze", nature: "Timid", evs: special, moves: ["Flamethrower", "Dragon Claw", "Earthquake", "Rock Slide"] });
const redBlastoise = set({ species: "Blastoise", item: "Mystic Water", ability: "Torrent", nature: "Modest", evs: bulkySpecial, moves: ["Surf", "Ice Beam", "Earthquake", "Rapid Spin"] });

// ---------- Hoenn (Steven, Wallace) ----------

const stevenSkarmory = set({ species: "Skarmory", item: "Leftovers", ability: "Keen Eye", nature: "Impish", evs: wall, moves: ["Spikes", "Drill Peck", "Toxic", "Roar"] });
const stevenClaydol = set({ species: "Claydol", item: "Leftovers", ability: "Levitate", nature: "Relaxed", evs: { hp: 252, atk: 128, spa: 128 }, moves: ["Earthquake", "Psychic", "Ice Beam", "Rapid Spin"] });
const stevenAggron = set({ species: "Aggron", item: "Leftovers", ability: "Rock Head", nature: "Adamant", evs: bulkyPhysical, moves: ["Double-Edge", "Earthquake", "Rock Slide", "Iron Tail"] });
const stevenCradily = set({ species: "Cradily", item: "Leftovers", ability: "Suction Cups", nature: "Careful", evs: wall, moves: ["Giga Drain", "Rock Slide", "Recover", "Toxic"] });
const stevenArmaldo = set({ species: "Armaldo", item: "Leftovers", ability: "Battle Armor", nature: "Adamant", evs: bulkyPhysical, moves: ["Rock Slide", "Earthquake", "Swords Dance", "Rapid Spin"] });
const stevenMetagross = set({ species: "Metagross", item: "Leftovers", ability: "Clear Body", nature: "Adamant", evs: { hp: 252, atk: 252, spd: 4 }, moves: ["Meteor Mash", "Earthquake", "Psychic", "Explosion"] });

const wallaceWailord = set({ species: "Wailord", item: "Leftovers", ability: "Water Veil", nature: "Modest", evs: special, moves: ["Water Spout", "Ice Beam", "Self-Destruct", "Toxic"] });
const wallaceTentacruel = set({ species: "Tentacruel", item: "Leftovers", ability: "Clear Body", nature: "Timid", evs: special, moves: ["Surf", "Sludge Bomb", "Rapid Spin", "Toxic"] });
const wallaceLudicolo = set({ species: "Ludicolo", item: "Leftovers", ability: "Swift Swim", nature: "Modest", evs: special, moves: ["Surf", "Giga Drain", "Ice Beam", "Rain Dance"] });
const wallaceWhiscash = set({ species: "Whiscash", item: "Leftovers", ability: "Oblivious", nature: "Quiet", evs: { hp: 252, atk: 128, spa: 128 }, moves: ["Earthquake", "Surf", "Ice Beam", "Amnesia"] });
const wallaceGyarados = set({ species: "Gyarados", item: "Leftovers", ability: "Intimidate", nature: "Jolly", evs: physical, moves: ["Dragon Dance", "Return", "Earthquake", "Taunt"] });
const wallaceMilotic = set({ species: "Milotic", item: "Leftovers", ability: "Marvel Scale", nature: "Bold", evs: wall, moves: ["Surf", "Ice Beam", "Recover", "Toxic"] });

// ---------- Sinnoh (Cynthia) ----------

const cynthiaSpiritomb = set({ species: "Spiritomb", item: "Leftovers", ability: "Pressure", nature: "Careful", evs: wall, moves: ["Will-O-Wisp", "Shadow Sneak", "Sucker Punch", "Pain Split"] });
const cynthiaRoserade = set({ species: "Roserade", item: "Life Orb", ability: "Natural Cure", nature: "Timid", evs: special, moves: ["Leaf Storm", "Sludge Bomb", "Shadow Ball", "Sleep Powder"] });
const cynthiaTogekiss = set({ species: "Togekiss", item: "Leftovers", ability: "Serene Grace", nature: "Timid", evs: { hp: 252, spa: 4, spe: 252 }, moves: ["Air Slash", "Aura Sphere", "Thunder Wave", "Roost"] });
const cynthiaLucario = set({ species: "Lucario", item: "Life Orb", ability: "Inner Focus", nature: "Adamant", evs: physical, moves: ["Swords Dance", "Close Combat", "Extreme Speed", "Stone Edge"] });
const cynthiaMilotic = set({ species: "Milotic", item: "Leftovers", ability: "Marvel Scale", nature: "Bold", evs: wall, moves: ["Surf", "Ice Beam", "Recover", "Haze"] });
const cynthiaGarchomp = set({ species: "Garchomp", item: "Yache Berry", ability: "Sand Veil", nature: "Jolly", evs: physical, moves: ["Swords Dance", "Earthquake", "Dragon Claw", "Fire Fang"] });

/**
 * The opponents. Rosters follow the games' final battles; sets are standard competitive
 * builds (Gen 3 for the older champions, Gen 4 for Cynthia), validated against Showdown's
 * Gen 4 rules in the tests.
 */
export const CHAMPIONS: readonly Champion[] = [
  {
    id: "blue",
    name: "Blue",
    title: "Campeão de Kanto",
    location: "Platô Indigo",
    team: [blueExeggutor, blueArcanine, blueRhydon, blueGyarados, blueMachamp, bluePidgeot],
  },
  {
    id: "lance",
    name: "Lance",
    title: "Campeão de Johto",
    location: "Platô Indigo",
    team: [lanceGyarados, lanceDragoniteDance, lanceDragoniteSpecial, lanceAerodactyl, lanceCharizard, lanceDragoniteBeam],
  },
  {
    id: "red",
    name: "Red",
    title: "Lenda do Monte Prateado",
    location: "Monte Prateado",
    team: [redPikachu, redEspeon, redSnorlax, redVenusaur, redCharizard, redBlastoise],
  },
  {
    id: "steven",
    name: "Steven",
    title: "Campeão de Hoenn",
    location: "Liga Pokémon de Hoenn",
    team: [stevenSkarmory, stevenClaydol, stevenAggron, stevenCradily, stevenArmaldo, stevenMetagross],
  },
  {
    id: "wallace",
    name: "Wallace",
    title: "Campeão de Hoenn",
    location: "Liga Pokémon de Hoenn",
    team: [wallaceWailord, wallaceTentacruel, wallaceLudicolo, wallaceWhiscash, wallaceGyarados, wallaceMilotic],
  },
  {
    id: "cynthia",
    name: "Cynthia",
    feminine: true,
    title: "Campeã de Sinnoh",
    location: "Liga Pokémon de Sinnoh",
    team: [cynthiaSpiritomb, cynthiaRoserade, cynthiaTogekiss, cynthiaLucario, cynthiaMilotic, cynthiaGarchomp],
  },
];

/** Retired ids still found in saved battles and daily picks: Blue used to have three teams. */
const LEGACY_IDS: Readonly<Record<string, string>> = { "blue-1": "blue", "blue-2": "blue", "blue-3": "blue" };

export function getChampion(id: string): Champion {
  const resolved = LEGACY_IDS[id] ?? id;
  const champion = CHAMPIONS.find((c) => c.id === resolved);
  if (!champion) throw new Error(`Unknown champion: ${id}`);
  return champion;
}

export function summarizeChampion(champion: Champion): {
  id: string;
  name: string;
  variant: string | null;
  title: string;
  location: string;
  feminine: boolean;
  team: string[];
} {
  return {
    id: champion.id,
    name: champion.name,
    variant: champion.variant ?? null,
    title: champion.title,
    location: champion.location,
    feminine: champion.feminine ?? false,
    team: champion.team.map((s) => s.species),
  };
}
