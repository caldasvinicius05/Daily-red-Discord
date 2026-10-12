import type { PokemonSet } from "../entities";

/**
 * Bump when the pool or Red's team changes: it is mixed into the daily seed,
 * so old saved battles stay tied to the pool they were played with.
 */
export const POOL_VERSION = 1;

const physical = { hp: 4, atk: 252, spe: 252 };
const special = { hp: 4, spa: 252, spe: 252 };
const mixed = { atk: 128, spa: 128, spe: 252 };
const bulkySpecial = { hp: 252, spa: 252, spd: 4 };
const bulky = { hp: 252, def: 128, spd: 128 };

/** Gen 1–3 non-legendary Pokémon the daily team is drawn from. All level 100, perfect IVs. */
export const PLAYER_POOL: readonly PokemonSet[] = [
  { species: "Gyarados", item: "Leftovers", ability: "Intimidate", nature: "Adamant", evs: physical, moves: ["Dragon Dance", "Earthquake", "Double-Edge", "Taunt"] },
  { species: "Jolteon", item: "Magnet", ability: "Volt Absorb", nature: "Timid", evs: special, moves: ["Thunderbolt", "Shadow Ball", "Thunder Wave", "Substitute"] },
  { species: "Flygon", item: "Soft Sand", ability: "Levitate", nature: "Naive", evs: mixed, moves: ["Earthquake", "Rock Slide", "Dragon Claw", "Fire Blast"] },
  { species: "Breloom", item: "Leftovers", ability: "Effect Spore", nature: "Adamant", evs: physical, moves: ["Spore", "Sky Uppercut", "Mach Punch", "Swords Dance"] },
  { species: "Slowbro", item: "Leftovers", ability: "Own Tempo", nature: "Modest", evs: bulkySpecial, moves: ["Surf", "Psychic", "Ice Beam", "Thunder Wave"] },
  { species: "Houndoom", item: "Charcoal", ability: "Flash Fire", nature: "Timid", evs: special, moves: ["Flamethrower", "Crunch", "Sludge Bomb", "Overheat"] },
  { species: "Arcanine", item: "Leftovers", ability: "Intimidate", nature: "Naive", evs: mixed, moves: ["Flamethrower", "Extreme Speed", "Crunch", "Iron Tail"] },
  { species: "Alakazam", item: "Twisted Spoon", ability: "Synchronize", nature: "Timid", evs: special, moves: ["Psychic", "Fire Punch", "Ice Punch", "Thunder Wave"] },
  { species: "Machamp", item: "Leftovers", ability: "Guts", nature: "Adamant", evs: { hp: 252, atk: 252, spd: 4 }, moves: ["Cross Chop", "Rock Slide", "Earthquake", "Bulk Up"] },
  { species: "Gengar", item: "Leftovers", ability: "Levitate", nature: "Timid", evs: special, moves: ["Thunderbolt", "Ice Punch", "Giga Drain", "Hypnosis"] },
  { species: "Rhydon", item: "Leftovers", ability: "Rock Head", nature: "Adamant", evs: { hp: 252, atk: 252, def: 4 }, moves: ["Earthquake", "Rock Slide", "Megahorn", "Double-Edge"] },
  { species: "Starmie", item: "Mystic Water", ability: "Natural Cure", nature: "Timid", evs: special, moves: ["Surf", "Thunderbolt", "Ice Beam", "Psychic"] },
  { species: "Scizor", item: "Leftovers", ability: "Swarm", nature: "Adamant", evs: { hp: 252, atk: 252, spd: 4 }, moves: ["Swords Dance", "Steel Wing", "Silver Wind", "Quick Attack"] },
  { species: "Heracross", item: "Leftovers", ability: "Guts", nature: "Adamant", evs: physical, moves: ["Megahorn", "Brick Break", "Rock Slide", "Swords Dance"] },
  { species: "Kingdra", item: "Leftovers", ability: "Swift Swim", nature: "Modest", evs: special, moves: ["Surf", "Ice Beam", "Dragon Breath", "Rain Dance"] },
  { species: "Donphan", item: "Leftovers", ability: "Sturdy", nature: "Adamant", evs: { hp: 252, atk: 252, def: 4 }, moves: ["Earthquake", "Rock Slide", "Rapid Spin", "Body Slam"] },
  { species: "Tyranitar", item: "Leftovers", ability: "Sand Stream", nature: "Adamant", evs: physical, moves: ["Dragon Dance", "Rock Slide", "Earthquake", "Crunch"] },
  { species: "Sceptile", item: "Miracle Seed", ability: "Overgrow", nature: "Timid", evs: special, moves: ["Leaf Blade", "Dragon Claw", "Thunder Punch", "Leech Seed"] },
  { species: "Blaziken", item: "Charcoal", ability: "Blaze", nature: "Naive", evs: mixed, moves: ["Blaze Kick", "Sky Uppercut", "Rock Slide", "Thunder Punch"] },
  { species: "Swampert", item: "Leftovers", ability: "Torrent", nature: "Brave", evs: { hp: 252, atk: 128, spa: 128 }, moves: ["Earthquake", "Surf", "Ice Beam", "Rock Slide"] },
  { species: "Ludicolo", item: "Leftovers", ability: "Swift Swim", nature: "Modest", evs: special, moves: ["Surf", "Giga Drain", "Ice Beam", "Rain Dance"] },
  { species: "Shiftry", item: "Leftovers", ability: "Chlorophyll", nature: "Modest", evs: special, moves: ["Giga Drain", "Faint Attack", "Extrasensory", "Explosion"] },
  { species: "Gardevoir", item: "Leftovers", ability: "Trace", nature: "Modest", evs: special, moves: ["Psychic", "Thunderbolt", "Fire Punch", "Calm Mind"] },
  { species: "Aggron", item: "Leftovers", ability: "Rock Head", nature: "Adamant", evs: { hp: 252, atk: 252, def: 4 }, moves: ["Double-Edge", "Earthquake", "Rock Slide", "Iron Tail"] },
  { species: "Medicham", item: "Leftovers", ability: "Pure Power", nature: "Adamant", evs: physical, moves: ["Hi Jump Kick", "Shadow Ball", "Rock Slide", "Bulk Up"] },
  { species: "Manectric", item: "Magnet", ability: "Lightning Rod", nature: "Timid", evs: special, moves: ["Thunderbolt", "Crunch", "Thunder Wave", "Substitute"] },
  { species: "Camerupt", item: "Charcoal", ability: "Magma Armor", nature: "Quiet", evs: { hp: 252, atk: 128, spa: 128 }, moves: ["Flamethrower", "Earthquake", "Rock Slide", "Explosion"] },
  { species: "Milotic", item: "Leftovers", ability: "Marvel Scale", nature: "Bold", evs: bulky, moves: ["Surf", "Ice Beam", "Recover", "Toxic"] },
  { species: "Salamence", item: "Leftovers", ability: "Intimidate", nature: "Naive", evs: mixed, moves: ["Dragon Claw", "Earthquake", "Flamethrower", "Brick Break"] },
  { species: "Metagross", item: "Leftovers", ability: "Clear Body", nature: "Adamant", evs: { hp: 252, atk: 252, spd: 4 }, moves: ["Meteor Mash", "Earthquake", "Psychic", "Explosion"] },
];

/** Red's fixed team on Mt. Silver. He always leads with the first slot. */
export const RED_TEAM: readonly PokemonSet[] = [
  { species: "Pikachu", item: "Light Ball", ability: "Static", nature: "Timid", evs: special, moves: ["Thunderbolt", "Thunder Wave", "Quick Attack", "Iron Tail"] },
  { species: "Espeon", item: "Leftovers", ability: "Synchronize", nature: "Timid", evs: special, moves: ["Psychic", "Shadow Ball", "Calm Mind", "Morning Sun"] },
  { species: "Snorlax", item: "Leftovers", ability: "Thick Fat", nature: "Adamant", evs: { hp: 252, atk: 252, spd: 4 }, moves: ["Body Slam", "Earthquake", "Shadow Ball", "Self-Destruct"] },
  { species: "Venusaur", item: "Miracle Seed", ability: "Overgrow", nature: "Modest", evs: bulkySpecial, moves: ["Giga Drain", "Sludge Bomb", "Sleep Powder", "Earthquake"] },
  { species: "Charizard", item: "Charcoal", ability: "Blaze", nature: "Timid", evs: special, moves: ["Flamethrower", "Dragon Claw", "Earthquake", "Rock Slide"] },
  { species: "Blastoise", item: "Mystic Water", ability: "Torrent", nature: "Modest", evs: bulkySpecial, moves: ["Surf", "Ice Beam", "Earthquake", "Rapid Spin"] },
];
